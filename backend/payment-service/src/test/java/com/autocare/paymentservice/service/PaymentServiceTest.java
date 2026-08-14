package com.autocare.paymentservice.service;

import com.autocare.paymentservice.config.RabbitMQConfig;
import com.autocare.paymentservice.dto.PaymentRequest;
import com.autocare.paymentservice.dto.WebhookPayload;
import com.autocare.paymentservice.entity.PaymentStatus;
import com.autocare.paymentservice.entity.ReferenceType;
import com.autocare.paymentservice.entity.Transaction;
import com.autocare.paymentservice.exception.PaymentAlreadyProcessedException;
import com.autocare.paymentservice.exception.TransactionNotOwnedException;
import com.autocare.paymentservice.gateway.GatewayResult;
import com.autocare.paymentservice.gateway.PaymentGateway;
import com.autocare.paymentservice.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private RabbitTemplate rabbitTemplate;

    private PaymentService paymentService;

    private final Long userId = 1L;
    private final Long otherUserId = 2L;
    private final Long bookingId = 100L;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(transactionRepository, paymentGateway, rabbitTemplate);
    }

    private PaymentRequest bookingRequest() {
        PaymentRequest request = new PaymentRequest();
        request.setReferenceType(ReferenceType.BOOKING);
        request.setReferenceId(bookingId);
        request.setAmount(new BigDecimal("999.00"));
        request.setPaymentMethod("UPI");
        return request;
    }

    private Transaction transaction(PaymentStatus status, String gatewayId, Long id) {
        Transaction t = new Transaction(userId, ReferenceType.BOOKING, bookingId,
                new BigDecimal("999.00"), "UPI");
        t.setId(id);
        t.setStatus(status);
        t.setGatewayTransactionId(gatewayId);
        return t;
    }

    // ─── CREATE / INITIATE ─────────────────────────────────────────────

    @Test
    void createPayment_ForBooking_ShouldPublishInitiatedEvent() {
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentGateway.initiate(any(), any(), any()))
                .thenReturn(new GatewayResult("pay_mock_abc123", "PENDING"));

        paymentService.createPayment(userId, bookingRequest());

        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_INITIATED),
                any(Object.class));
    }

    @Test
    void createPayment_DuplicateActivePayment_ShouldReject() {
        when(transactionRepository.existsByReferenceTypeAndReferenceIdAndStatusIn(
                eq(ReferenceType.BOOKING), eq(bookingId), anyCollection())).thenReturn(true);

        assertThrows(PaymentAlreadyProcessedException.class,
                () -> paymentService.createPayment(userId, bookingRequest()));
        verify(paymentGateway, never()).initiate(any(), any(), any());
    }

    @Test
    void createPayment_ForSparePart_ShouldNotPublishInitiatedEvent() {
        PaymentRequest request = bookingRequest();
        request.setReferenceType(ReferenceType.SPARE_PART);
        request.setReferenceId(55L);

        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentGateway.initiate(any(), any(), any()))
                .thenReturn(new GatewayResult("pay_mock_xyz789", "PENDING"));

        paymentService.createPayment(userId, request);

        verify(rabbitTemplate, never()).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_INITIATED), any(Object.class));
    }

    // ─── PROCESS (simulation) ──────────────────────────────────────────

    @Test
    void processTransaction_Success_ShouldMarkPaidAndPublishEvent() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "pay_mock_abc", 10L);
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(txn));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = paymentService.processTransaction(10L, userId, "SUCCESS");

        assertEquals("processed", result.get("status"));
        assertEquals("SUCCESS", result.get("transactionStatus"));
        assertEquals(PaymentStatus.SUCCESS, txn.getStatus());
        assertNotNull(txn.getPaidAt());
        verify(rabbitTemplate).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS), any(Object.class));
    }

    @Test
    void processTransaction_Failed_ShouldMarkFailedAndPublishEvent() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "pay_mock_abc", 10L);
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(txn));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.processTransaction(10L, userId, "FAILED");

        assertEquals(PaymentStatus.FAILED, txn.getStatus());
        verify(rabbitTemplate).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_FAILED), any(Object.class));
    }

    @Test
    void processTransaction_AlreadyProcessed_ShouldReject() {
        Transaction txn = transaction(PaymentStatus.SUCCESS, "pay_mock_abc", 10L);
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(txn));

        assertThrows(PaymentAlreadyProcessedException.class,
                () -> paymentService.processTransaction(10L, userId, "SUCCESS"));
        verify(transactionRepository, never()).save(any());
        verify(rabbitTemplate, never()).convertAndSend(
                anyString(), anyString(), any(Object.class));
    }

    @Test
    void processTransaction_NotOwner_ShouldReject() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "pay_mock_abc", 10L);
        when(transactionRepository.findById(10L)).thenReturn(Optional.of(txn));

        assertThrows(TransactionNotOwnedException.class,
                () -> paymentService.processTransaction(10L, otherUserId, "SUCCESS"));
        verify(transactionRepository, never()).save(any());
    }

    // ─── WEBHOOK ───────────────────────────────────────────────────────

    @Test
    void processWebhook_AlreadyProcessed_ShouldBeIdempotent() {
        Transaction txn = transaction(PaymentStatus.SUCCESS, "pay_mock_abc", 10L);
        when(paymentGateway.verifyWebhookSignature(any())).thenReturn(true);
        when(transactionRepository.findByGatewayTransactionId("pay_mock_abc"))
                .thenReturn(Optional.of(txn));

        Map<String, Object> result = paymentService.processWebhook(payload("pay_mock_abc", "SUCCESS"));

        assertEquals("already_processed", result.get("status"));
        verify(rabbitTemplate, never()).convertAndSend(
                anyString(), anyString(), any(Object.class));
    }

    @Test
    void processWebhook_WithInvalidSignature_ShouldReject() {
        when(paymentGateway.verifyWebhookSignature(any())).thenReturn(false);

        assertThrows(com.autocare.paymentservice.exception.InvalidWebhookSignatureException.class,
                () -> paymentService.processWebhook(payload("pay_mock_abc", "SUCCESS")));
    }

    // ─── OWNERSHIP / QUERY ─────────────────────────────────────────────

    @Test
    void getTransaction_NotOwner_ShouldThrow() {
        when(transactionRepository.findById(10L))
                .thenReturn(Optional.of(transaction(PaymentStatus.INITIATED, "pay_mock_abc", 10L)));

        assertThrows(TransactionNotOwnedException.class,
                () -> paymentService.getTransaction(10L, otherUserId));
    }

    private WebhookPayload payload(String gatewayId, String status) {
        WebhookPayload payload = new WebhookPayload();
        payload.setGatewayTransactionId(gatewayId);
        payload.setStatus(status);
        payload.setSignature("sig");
        return payload;
    }
}
