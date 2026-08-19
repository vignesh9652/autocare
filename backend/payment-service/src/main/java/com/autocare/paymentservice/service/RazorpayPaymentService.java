package com.autocare.paymentservice.service;

import com.autocare.paymentservice.client.BookingServiceClient;
import com.autocare.paymentservice.client.SparePartsServiceClient;
import com.autocare.paymentservice.config.RabbitMQConfig;
import com.autocare.paymentservice.dto.*;
import com.autocare.paymentservice.entity.PaymentStatus;
import com.autocare.paymentservice.entity.ReferenceType;
import com.autocare.paymentservice.entity.Transaction;
import com.autocare.paymentservice.exception.*;
import com.autocare.paymentservice.gateway.GatewayResult;
import com.autocare.paymentservice.gateway.RazorpayGatewayService;
import com.autocare.paymentservice.repository.TransactionRepository;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Razorpay payment flow for bookings.
 *
 * <pre>
 *   POST /api/payments/create-order   → validate booking + create Razorpay order
 *   POST /api/payments/verify         → verify signature, mark SUCCESS, notify booking-service
 *   POST /api/payments/webhook/razorpay → Razorpay event callback (payment.captured / failed)
 * </pre>
 *
 * <p>Security rules enforced here:</p>
 * <ul>
 *   <li>The amount always comes from the booking's server-side final amount —
 *       anything sent by the client is ignored.</li>
 *   <li>Ownership is enforced by booking-service (forwarded customer JWT) and
 *       double-checked locally.</li>
 *   <li>Only {@code COMPLETED} bookings can start a payment; a booking can
 *       never be paid twice (SUCCESS is terminal).</li>
 *   <li>Every finalization (verify, webhook) is idempotent — repeat callbacks
 *       are acknowledged without re-publishing events.</li>
 * </ul>
 */
@Service
public class RazorpayPaymentService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayPaymentService.class);

    private static final List<PaymentStatus> ACTIVE_OR_DONE =
            List.of(PaymentStatus.INITIATED, PaymentStatus.SUCCESS);

    private final TransactionRepository transactionRepository;
    private final BookingServiceClient bookingServiceClient;
    private final SparePartsServiceClient sparePartsServiceClient;
    private final RazorpayGatewayService gateway;
    private final RabbitTemplate rabbitTemplate;

    public RazorpayPaymentService(TransactionRepository transactionRepository,
                                  BookingServiceClient bookingServiceClient,
                                  SparePartsServiceClient sparePartsServiceClient,
                                  RazorpayGatewayService gateway,
                                  RabbitTemplate rabbitTemplate) {
        this.transactionRepository = transactionRepository;
        this.bookingServiceClient = bookingServiceClient;
        this.sparePartsServiceClient = sparePartsServiceClient;
        this.gateway = gateway;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Step 1 of the flow. Validates the booking (exists, owned by the caller,
     * COMPLETED, has a payable amount, not already paid) and creates the
     * Razorpay order. The customer's JWT is forwarded to booking-service so
     * ownership is verified there.
     */
    @Transactional
    public CreateOrderResponse createOrder(Long userId, Long bookingId, String authHeader) {
        // 1. Fetch + validate the booking (ownership enforced by booking-service)
        Map<String, Object> booking = bookingServiceClient.getBooking(bookingId, authHeader);
        validateOwnership(booking, userId);

        String status = stringOf(booking.get("status"));
        if (!"COMPLETED".equals(status)) {
            throw new BookingNotEligibleException(
                    "Booking #" + bookingId + " is not ready for payment (status: "
                            + status + "). Payment opens once the service is completed.");
        }

        // 2. The amount is authoritative from the booking — never the client
        BigDecimal finalAmount = decimalOf(booking.get("finalAmount"));
        if (finalAmount == null) {
            finalAmount = decimalOf(booking.get("estimatedAmount"));
        }
        if (finalAmount == null || finalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BookingNotEligibleException(
                    "Booking #" + bookingId + " has no payable amount.");
        }

        // 3. Duplicate payment prevention — one active/successful payment per booking
        if (transactionRepository.existsByReferenceTypeAndReferenceIdAndStatusIn(
                ReferenceType.BOOKING, bookingId, ACTIVE_OR_DONE)) {
            throw new PaymentAlreadyProcessedException(
                    "Payment already completed or in progress for booking #" + bookingId
                            + " — cannot pay twice.");
        }

        // 4. Persist the INITIATED transaction, then create the Razorpay order
        Transaction transaction = new Transaction(
                userId, ReferenceType.BOOKING, bookingId, finalAmount, "RAZORPAY");
        transaction = transactionRepository.save(transaction);

        try {
            GatewayResult result = gateway.createOrder(
                    finalAmount, "INR", "AC-BK-" + bookingId + "-" + transaction.getId());
            transaction.setGatewayTransactionId(result.gatewayTransactionId());
            transaction = transactionRepository.save(transaction);
        } catch (PaymentGatewayException e) {
            // Order creation failed — close the transaction so the booking can retry
            transaction.setStatus(PaymentStatus.FAILED);
            transactionRepository.save(transaction);
            throw e;
        }

        // 5. Notify booking-service → booking moves COMPLETED → PAYMENT_PENDING
        try {
            PaymentInitiatedEvent event = new PaymentInitiatedEvent(
                    userId, transaction.getId(), ReferenceType.BOOKING, bookingId, finalAmount);
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY_PAYMENT_INITIATED,
                    event);
            log.info("📨 [RAZORPAY] payment.initiated published for booking #{} (txn #{})",
                    bookingId, transaction.getId());
        } catch (RuntimeException e) {
            // A transient broker failure must not lose a valid Razorpay order —
            // log loudly so the operator can retry the event.
            log.error("⚠️ [RAZORPAY] Failed to publish payment.initiated for booking #{}" +
                    " — order {} already exists, event needs manual retry",
                    bookingId, transaction.getGatewayTransactionId(), e);
            throw e;
        }

        log.info("💳 Razorpay order {} created for booking #{} (txn #{}, {} {})",
                transaction.getGatewayTransactionId(), bookingId, transaction.getId(),
                finalAmount, "INR");

        return new CreateOrderResponse(
                transaction.getId(),
                bookingId,
                transaction.getGatewayTransactionId(),
                gateway.getKeyId(),
                finalAmount.multiply(BigDecimal.valueOf(100)).longValue(),
                "INR",
                transaction.getStatus().name());
    }

    /**
     * Step 2 of the flow — called from the Razorpay Checkout handler.
     *
     * <ul>
     *   <li>Blank {@code razorpayPaymentId} → the customer dismissed the
     *       checkout; the pending transaction is closed as FAILED (no event is
     *       needed for the booking, it is reverted by the failure event).</li>
     *   <li>Valid signature + captured payment → SUCCESS + {@code payment.success}.</li>
     *   <li>Invalid signature → rejected (400).</li>
     * </ul>
     */
    @Transactional
    public VerifyPaymentResponse verifyPayment(Long userId, VerifyPaymentRequest request) {
        String orderId = request.getRazorpayOrderId();
        Transaction transaction = transactionRepository.findByGatewayTransactionId(orderId)
                .orElseThrow(() -> new TransactionNotFoundException(
                        "No payment found for Razorpay order: " + orderId));

        if (!transaction.getUserId().equals(userId)) {
            throw new TransactionNotOwnedException("This payment does not belong to you");
        }

        // Idempotent: an already-SUCCESS payment acknowledges without reprocessing
        if (transaction.getStatus() == PaymentStatus.SUCCESS) {
            return toVerifyResponse(true, false, transaction);
        }

        // Checkout dismissed without paying → close the transaction for retry.
        // A FAILED transaction without a real payment id is already closed.
        if (!StringUtils.hasText(request.getRazorpayPaymentId())) {
            if (transaction.getStatus() == PaymentStatus.FAILED) {
                return toVerifyResponse(false, false, transaction);
            }
            return closeAsCancelled(transaction);
        }

        // A FAILED transaction with a *real* signature is a race recovery:
        // the checkout was dismissed as the payment was being captured. If the
        // signature verifies, the payment really happened → upgrade to SUCCESS.
        if (transaction.getStatus() == PaymentStatus.FAILED) {
            log.info("♻️ [RAZORPAY] Re-verifying a cancelled payment {} for order {}",
                    request.getRazorpayPaymentId(), orderId);
        }

        // 1. Verify the Razorpay signature — never trust the client payload
        if (!gateway.verifyPaymentSignature(
                orderId, request.getRazorpayPaymentId(), request.getRazorpaySignature())) {
            throw new InvalidRazorpaySignatureException(
                    "Razorpay signature verification failed for order " + orderId);
        }

        // 2. Confirm with Razorpay that the payment was captured for this order.
        //    Best-effort: if the gateway is briefly unreachable the signature
        //    (already a strong proof) is sufficient; a *reachable* gateway with
        //    a non-captured payment or amount mismatch is a hard failure.
        String resolvedMethod = null;
        try {
            RazorpayGatewayService.RazorpayPaymentInfo info =
                    gateway.fetchPayment(request.getRazorpayPaymentId());
            if (!orderId.equals(info.orderId())) {
                throw new InvalidRazorpaySignatureException(
                        "Payment " + request.getRazorpayPaymentId()
                                + " does not belong to order " + orderId);
            }
            if (!"captured".equals(info.status())) {
                throw new InvalidRazorpaySignatureException(
                        "Payment " + request.getRazorpayPaymentId()
                                + " was not captured (status: " + info.status() + ")");
            }
            long expectedPaise = transaction.getAmount()
                    .multiply(BigDecimal.valueOf(100)).longValue();
            if (info.amountPaise() != expectedPaise) {
                throw new InvalidRazorpaySignatureException(
                        "Payment amount mismatch: expected " + expectedPaise
                                + " paise but Razorpay captured " + info.amountPaise());
            }
            resolvedMethod = normalizeMethod(info.method());
        } catch (PaymentGatewayException e) {
            log.warn("⚠️ [RAZORPAY] Fetch failed during verify (proceeding on signature): {}", e.getMessage());
        }

        // 3. Finalize as SUCCESS and notify booking-service (PAID + commission split)
        transaction.setStatus(PaymentStatus.SUCCESS);
        transaction.setRazorpayPaymentId(request.getRazorpayPaymentId());
        transaction.setRazorpaySignature(request.getRazorpaySignature());
        transaction.setPaymentMethod(resolvedMethod != null ? resolvedMethod : transaction.getPaymentMethod());
        transaction.setPaidAt(LocalDateTime.now());
        transactionRepository.save(transaction);

        publishSuccess(transaction);

        return toVerifyResponse(true, false, transaction);
    }

    /**
     * Razorpay webhook callback. Public endpoint — authenticity is proven by
     * the {@code X-Razorpay-Signature} header over the raw body. Idempotent:
     * duplicate events for an already-finalized transaction are acknowledged
     * without re-publishing events or double-computing commission.
     */
    @Transactional
    public Map<String, Object> handleWebhook(String rawBody, String signature) {
        if (!gateway.verifyWebhookSignature(rawBody, signature)) {
            throw new InvalidRazorpaySignatureException("Invalid Razorpay webhook signature");
        }

        JSONObject event = new JSONObject(rawBody);
        String eventName = event.optString("event", "");

        // Only payment.captured / payment.failed matter — acknowledge everything else
        if (!"payment.captured".equals(eventName) && !"payment.failed".equals(eventName)) {
            return Map.of("status", "ignored", "event", eventName);
        }

        JSONObject payload = event.optJSONObject("payload");
        JSONObject paymentObj = payload != null ? payload.optJSONObject("payment") : null;
        JSONObject entity = paymentObj != null ? paymentObj.optJSONObject("entity") : null;
        if (entity == null) {
            throw new IllegalArgumentException("Webhook payload has no payment entity");
        }

        String orderId = entity.optString("order_id", "");
        String paymentId = entity.optString("id", "");
        String method = entity.optString("method", "");
        long amountPaise = entity.optLong("amount", 0L);

        Transaction transaction = transactionRepository.findByGatewayTransactionId(orderId)
                .orElseThrow(() -> new TransactionNotFoundException(
                        "No transaction found for Razorpay order: " + orderId));

        // Idempotency — an already-SUCCESS transaction acknowledges without
        // reprocessing. A FAILED transaction may still be upgraded by a genuine
        // payment.captured event (the checkout was dismissed as the payment was
        // captured; the captured webhook is authoritative).
        if (transaction.getStatus() == PaymentStatus.SUCCESS) {
            log.info("🔄 [RAZORPAY] Webhook {} for order {} already processed ({}) — skipping",
                    eventName, orderId, transaction.getStatus());
            return Map.of("status", "already_processed",
                    "transactionStatus", transaction.getStatus().name());
        }
        if (transaction.getStatus() == PaymentStatus.FAILED
                && !"payment.captured".equals(eventName)) {
            log.info("🔄 [RAZORPAY] Webhook {} for order {} already processed ({}) — skipping",
                    eventName, orderId, transaction.getStatus());
            return Map.of("status", "already_processed",
                    "transactionStatus", transaction.getStatus().name());
        }
        if (transaction.getStatus() == PaymentStatus.FAILED) {
            log.info("♻️ [RAZORPAY] Captured webhook upgrades a cancelled payment for order {}", orderId);
        }

        // Amount sanity check: a captured amount that differs from the order is
        // a red flag — fail the transaction instead of crediting the wrong sum.
        long expectedPaise = transaction.getAmount()
                .multiply(BigDecimal.valueOf(100)).longValue();
        if (amountPaise > 0 && amountPaise != expectedPaise) {
            log.warn("⚠️ [RAZORPAY] Webhook amount {} paise != order {} paise for order {}",
                    amountPaise, expectedPaise, orderId);
            transaction.setStatus(PaymentStatus.FAILED);
            transactionRepository.save(transaction);
            publishFailed(transaction);
            return Map.of("status", "amount_mismatch", "transactionStatus", "FAILED");
        }

        if ("payment.captured".equals(eventName)) {
            transaction.setStatus(PaymentStatus.SUCCESS);
            transaction.setRazorpayPaymentId(paymentId);
            transaction.setPaymentMethod(normalizeMethod(method));
            transaction.setPaidAt(LocalDateTime.now());
            transactionRepository.save(transaction);
            publishSuccess(transaction);
            return Map.of("status", "processed", "transactionStatus", "SUCCESS");
        }

        // payment.failed
        transaction.setStatus(PaymentStatus.FAILED);
        transactionRepository.save(transaction);
        publishFailed(transaction);
        return Map.of("status", "processed", "transactionStatus", "FAILED");
    }

    // ─── Spare-part order Razorpay flow ───────────────────────────────────

    /**
     * Creates a Razorpay order for a spare-part purchase. The amount is resolved
     * server-side from the order's totalAmount — the client only sends the order
     * id and its JWT.
     *
     * <p>When {@code includeInstallationFee} is true the platform-configured
     * installation fee is added so the customer pays for part + delivery +
     * installation in a single Razorpay transaction (Buy + Install flow).</p>
     */
    @Transactional
    public CreateSparePartOrderResponse createSparePartOrder(
            Long userId, Long orderId, String authHeader, boolean includeInstallationFee) {
        // 1. Fetch + validate the order via spareparts-service
        Map<String, Object> order = sparePartsServiceClient.getOrderStatus(orderId, authHeader);

        // Ownership check
        Number owner = (Number) order.get("userId");
        if (owner != null && owner.longValue() != userId.longValue()) {
            throw new TransactionNotOwnedException("This order does not belong to you");
        }

        String paymentStatus = stringOf(order.get("paymentStatus"));
        if ("PAID".equalsIgnoreCase(paymentStatus)) {
            throw new PaymentAlreadyProcessedException(
                    "Order #" + orderId + " is already paid — cannot pay twice.");
        }

        // 2. The amount is authoritative from the order — never the client
        BigDecimal totalAmount = decimalOf(order.get("totalAmount"));
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BookingNotEligibleException(
                    "Order #" + orderId + " has no payable amount.");
        }

        // 2b. Buy + Install: add the platform-configured installation fee
        BigDecimal razorpayAmount = totalAmount;
        if (includeInstallationFee) {
            BigDecimal installationFee = bookingServiceClient.currentInstallationFee();
            if (installationFee != null && installationFee.compareTo(BigDecimal.ZERO) > 0) {
                razorpayAmount = razorpayAmount.add(installationFee);
                log.info("🔧 Combined Buy+Install: added installation fee {} to order #{} total {} → {}",
                        installationFee, orderId, totalAmount, razorpayAmount);
            }
        }

        // 3. Duplicate payment prevention — one active/successful payment per order
        if (transactionRepository.existsByReferenceTypeAndReferenceIdAndStatusIn(
                ReferenceType.SPARE_PART, orderId, ACTIVE_OR_DONE)) {
            throw new PaymentAlreadyProcessedException(
                    "Payment already completed or in progress for order #" + orderId
                            + " — cannot pay twice.");
        }

        // 4. Persist the INITIATED transaction, then create the Razorpay order
        Transaction transaction = new Transaction(
                userId, ReferenceType.SPARE_PART, orderId, razorpayAmount, "RAZORPAY");
        transaction = transactionRepository.save(transaction);

        try {
            GatewayResult result = gateway.createOrder(
                    razorpayAmount, "INR", "AC-SP-" + orderId + "-" + transaction.getId());
            transaction.setGatewayTransactionId(result.gatewayTransactionId());
            transaction = transactionRepository.save(transaction);
        } catch (PaymentGatewayException e) {
            transaction.setStatus(PaymentStatus.FAILED);
            transactionRepository.save(transaction);
            throw e;
        }

        log.info("💳 Razorpay order {} created for spare-part order #{} (txn #{}, {} {})",
                transaction.getGatewayTransactionId(), orderId, transaction.getId(),
                razorpayAmount, "INR");

        return new CreateSparePartOrderResponse(
                transaction.getId(),
                orderId,
                transaction.getGatewayTransactionId(),
                gateway.getKeyId(),
                razorpayAmount.multiply(BigDecimal.valueOf(100)).longValue(),
                "INR",
                transaction.getStatus().name());
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private VerifyPaymentResponse closeAsCancelled(Transaction transaction) {
        if (transaction.getStatus() == PaymentStatus.INITIATED) {
            transaction.setStatus(PaymentStatus.FAILED);
            transactionRepository.save(transaction);
            // Booking-service reverts PAYMENT_PENDING → COMPLETED on payment.failed,
            // freeing the booking for a retry.
            publishFailed(transaction);
            log.info("🚫 Razorpay checkout dismissed for order {} — payment closed for retry",
                    transaction.getGatewayTransactionId());
        }
        return toVerifyResponse(false, true, transaction);
    }

    private void publishSuccess(Transaction transaction) {
        PaymentSuccessEvent event = new PaymentSuccessEvent(
                transaction.getUserId(),
                transaction.getId(),
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                transaction.getAmount());
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS,
                event);
        log.info("✅ [RAZORPAY] Payment #{} succeeded ({}), published payment.success",
                transaction.getId(), transaction.getGatewayTransactionId());
    }

    private void publishFailed(Transaction transaction) {
        PaymentFailedEvent event = new PaymentFailedEvent(
                transaction.getUserId(),
                transaction.getId(),
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                transaction.getAmount());
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_PAYMENT_FAILED,
                event);
        log.info("❌ [RAZORPAY] Payment #{} failed ({}), published payment.failed",
                transaction.getId(), transaction.getGatewayTransactionId());
    }

    private void validateOwnership(Map<String, Object> booking, Long userId) {
        Number owner = (Number) booking.get("userId");
        if (owner != null && owner.longValue() != userId.longValue()) {
            throw new TransactionNotOwnedException("This booking does not belong to you");
        }
    }

    private String normalizeMethod(String method) {
        if (!StringUtils.hasText(method)) {
            return "RAZORPAY";
        }
        return switch (method.toLowerCase()) {
            case "upi" -> "UPI";
            case "card" -> "CARD";
            case "netbanking" -> "NETBANKING";
            case "wallet" -> "WALLET";
            case "emi" -> "EMI";
            case "bank_transfer" -> "BANK_TRANSFER";
            default -> method.toUpperCase();
        };
    }

    private VerifyPaymentResponse toVerifyResponse(boolean success, boolean cancelled,
                                                   Transaction transaction) {
        return new VerifyPaymentResponse(
                success,
                cancelled,
                transaction.getId(),
                transaction.getReferenceId(),
                transaction.getRazorpayPaymentId() != null
                        ? transaction.getRazorpayPaymentId()
                        : transaction.getGatewayTransactionId(),
                transaction.getRazorpayPaymentId(),
                transaction.getPaymentMethod(),
                transaction.getAmount(),
                transaction.getStatus().name());
    }

    private String stringOf(Object value) {
        return value != null ? value.toString() : null;
    }

    private BigDecimal decimalOf(Object value) {
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return new BigDecimal(n.toString());
        }
        if (value instanceof String s) {
            try {
                return new BigDecimal(s);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
