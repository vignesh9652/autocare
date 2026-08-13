package com.autocare.paymentservice.service;

import com.autocare.paymentservice.config.RabbitMQConfig;
import com.autocare.paymentservice.dto.*;
import com.autocare.paymentservice.entity.PaymentStatus;
import com.autocare.paymentservice.entity.ReferenceType;
import com.autocare.paymentservice.entity.Transaction;
import com.autocare.paymentservice.exception.InvalidWebhookSignatureException;
import com.autocare.paymentservice.exception.PaymentAlreadyProcessedException;
import com.autocare.paymentservice.exception.TransactionNotFoundException;
import com.autocare.paymentservice.exception.TransactionNotOwnedException;
import com.autocare.paymentservice.gateway.GatewayResult;
import com.autocare.paymentservice.gateway.PaymentGateway;
import com.autocare.paymentservice.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final TransactionRepository transactionRepository;
    private final PaymentGateway paymentGateway;
    private final RabbitTemplate rabbitTemplate;

    public PaymentService(TransactionRepository transactionRepository,
                          PaymentGateway paymentGateway,
                          RabbitTemplate rabbitTemplate) {
        this.transactionRepository = transactionRepository;
        this.paymentGateway = paymentGateway;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Creates a Transaction in INITIATED state, asks the (mock) gateway for a
     * gateway-side id, and notifies booking-service ({@code payment.initiated})
     * so the referenced booking moves to PAYMENT_PENDING.
     */
    public PaymentResponse createPayment(Long userId, PaymentRequest request) {
        // Duplicate-payment prevention: one active payment per reference. A
        // new payment is only allowed once every earlier attempt FAILED.
        if (transactionRepository.existsByReferenceTypeAndReferenceIdAndStatusIn(
                request.getReferenceType(), request.getReferenceId(),
                List.of(PaymentStatus.INITIATED, PaymentStatus.SUCCESS))) {
            throw new PaymentAlreadyProcessedException(
                    "A payment for this " + request.getReferenceType().name().toLowerCase()
                            + " is already in progress or completed — cannot pay twice");
        }

        Transaction transaction = new Transaction(
                userId,
                request.getReferenceType(),
                request.getReferenceId(),
                request.getAmount(),
                request.getPaymentMethod()
        );

        transaction = transactionRepository.save(transaction);

        GatewayResult result = paymentGateway.initiate(
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getPaymentMethod()
        );

        transaction.setGatewayTransactionId(result.gatewayTransactionId());
        transaction = transactionRepository.save(transaction);

        log.info("💳 Payment #{} initiated via {} (gateway id: {})",
                transaction.getId(), transaction.getPaymentMethod(), transaction.getGatewayTransactionId());

        // Let booking-service know the customer started paying for a booking
        if (request.getReferenceType() == ReferenceType.BOOKING) {
            PaymentInitiatedEvent event = new PaymentInitiatedEvent(
                    userId,
                    transaction.getId(),
                    ReferenceType.BOOKING,
                    request.getReferenceId(),
                    request.getAmount()
            );
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY_PAYMENT_INITIATED,
                    event
            );
        }

        return toResponse(transaction);
    }

    /**
     * Development simulation of the gateway's final status callback:
     * {@code POST /api/payments/{id}/process} with {@code {"status":"SUCCESS"}}
     * or {@code {"status":"FAILED"}}. In production this exact finalization is
     * driven by the gateway webhook instead. Rejects repeat processing so a
     * booking cannot be paid twice.
     */
    @Transactional
    public Map<String, Object> processTransaction(Long id, Long userId, String status) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + id));

        if (!transaction.getUserId().equals(userId)) {
            throw new TransactionNotOwnedException("This transaction does not belong to you");
        }

        PaymentStatus newStatus = PaymentStatus.valueOf(status);

        // Duplicate-payment prevention: a finalized transaction is terminal.
        if (transaction.getStatus() == PaymentStatus.SUCCESS
                || transaction.getStatus() == PaymentStatus.FAILED) {
            throw new PaymentAlreadyProcessedException(
                    "Payment already " + transaction.getStatus().name().toLowerCase()
                            + " — cannot be processed twice");
        }

        finalizeTransaction(transaction, newStatus);

        return Map.of(
                "status", "processed",
                "transactionStatus", newStatus.name());
    }

    /**
     * Handles a gateway webhook callback. Idempotent: if this
     * gatewayTransactionId was already finalized (SUCCESS or FAILED), the
     * payload is acknowledged without re-publishing events.
     *
     * Transactional + pessimistic row lock so concurrent duplicate webhooks
     * for the same gateway transaction serialize on the row and only the
     * first one publishes an event.
     */
    @Transactional
    public Map<String, Object> processWebhook(WebhookPayload payload) {
        // 1. Verify the payload actually came from the gateway
        if (!paymentGateway.verifyWebhookSignature(payload)) {
            throw new InvalidWebhookSignatureException("Invalid webhook signature");
        }

        // 2. Validate status
        PaymentStatus newStatus;
        try {
            newStatus = PaymentStatus.valueOf(payload.getStatus());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid webhook status: " + payload.getStatus() + " (expected SUCCESS or FAILED)");
        }
        if (newStatus == PaymentStatus.INITIATED) {
            throw new IllegalArgumentException(
                    "Webhook status must be SUCCESS or FAILED, got: " + payload.getStatus());
        }

        // 3. Find the transaction by gateway id
        Transaction transaction = transactionRepository
                .findByGatewayTransactionId(payload.getGatewayTransactionId())
                .orElseThrow(() -> new TransactionNotFoundException(
                        "No transaction found for gateway transaction id: "
                                + payload.getGatewayTransactionId()));

        // 4. Idempotency check - already processed, acknowledge without reprocessing
        if (transaction.getStatus() == PaymentStatus.SUCCESS
                || transaction.getStatus() == PaymentStatus.FAILED) {
            log.info("🔄 Webhook for gateway id {} already processed (status {}), skipping",
                    payload.getGatewayTransactionId(), transaction.getStatus());
            return Map.of(
                    "status", "already_processed",
                    "transactionStatus", transaction.getStatus().name());
        }

        // 5. Finalize and publish the corresponding event
        finalizeTransaction(transaction, newStatus);

        return Map.of(
                "status", "processed",
                "transactionStatus", newStatus.name());
    }

    /**
     * Shared finalization: marks the transaction SUCCESS/FAILED (recording the
     * payment time on success) and publishes the matching payment event.
     */
    private void finalizeTransaction(Transaction transaction, PaymentStatus newStatus) {
        transaction.setStatus(newStatus);
        if (newStatus == PaymentStatus.SUCCESS) {
            transaction.setPaidAt(LocalDateTime.now());
        }
        transactionRepository.save(transaction);

        if (newStatus == PaymentStatus.SUCCESS) {
            PaymentSuccessEvent event = new PaymentSuccessEvent(
                    transaction.getUserId(),
                    transaction.getId(),
                    transaction.getReferenceType(),
                    transaction.getReferenceId(),
                    transaction.getAmount()
            );
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS,
                    event
            );
            log.info("✅ Payment #{} succeeded, published payment.success", transaction.getId());
        } else {
            PaymentFailedEvent event = new PaymentFailedEvent(
                    transaction.getUserId(),
                    transaction.getId(),
                    transaction.getReferenceType(),
                    transaction.getReferenceId(),
                    transaction.getAmount()
            );
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY_PAYMENT_FAILED,
                    event
            );
            log.info("❌ Payment #{} failed, published payment.failed", transaction.getId());
        }
    }

    public PaymentResponse getTransaction(Long id, Long userId) {
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new TransactionNotFoundException("Transaction not found with id: " + id));

        if (!transaction.getUserId().equals(userId)) {
            throw new TransactionNotOwnedException("This transaction does not belong to you");
        }

        return toResponse(transaction);
    }

    public List<PaymentResponse> getUserTransactions(Long userId) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * All transactions across all users. Admin-only (guarded by SecurityConfig).
     */
    public List<PaymentResponse> getAllTransactions() {
        return transactionRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private PaymentResponse toResponse(Transaction transaction) {
        return new PaymentResponse(
                transaction.getId(),
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getStatus(),
                transaction.getGatewayTransactionId(),
                transaction.getPaymentMethod(),
                transaction.getPaidAt(),
                transaction.getCreatedAt()
        );
    }
}
