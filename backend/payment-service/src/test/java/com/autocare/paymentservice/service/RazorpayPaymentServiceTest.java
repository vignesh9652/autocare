package com.autocare.paymentservice.service;

import com.autocare.paymentservice.client.BookingServiceClient;
import com.autocare.paymentservice.config.RabbitMQConfig;
import com.autocare.paymentservice.dto.CreateOrderResponse;
import com.autocare.paymentservice.dto.VerifyPaymentRequest;
import com.autocare.paymentservice.dto.VerifyPaymentResponse;
import com.autocare.paymentservice.entity.PaymentStatus;
import com.autocare.paymentservice.entity.ReferenceType;
import com.autocare.paymentservice.entity.Transaction;
import com.autocare.paymentservice.exception.BookingNotEligibleException;
import com.autocare.paymentservice.exception.InvalidRazorpaySignatureException;
import com.autocare.paymentservice.exception.PaymentAlreadyProcessedException;
import com.autocare.paymentservice.exception.PaymentGatewayException;
import com.autocare.paymentservice.exception.TransactionNotFoundException;
import com.autocare.paymentservice.exception.TransactionNotOwnedException;
import com.autocare.paymentservice.gateway.GatewayResult;
import com.autocare.paymentservice.gateway.RazorpayGatewayService;
import com.autocare.paymentservice.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
class RazorpayPaymentServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private BookingServiceClient bookingServiceClient;

    @Mock
    private RazorpayGatewayService gateway;

    @Mock
    private RabbitTemplate rabbitTemplate;

    private RazorpayPaymentService paymentService;

    private final Long userId = 1L;
    private final Long otherUserId = 2L;
    private final Long bookingId = 100L;

    @BeforeEach
    void setUp() {
        paymentService = new RazorpayPaymentService(
                transactionRepository, bookingServiceClient, gateway, rabbitTemplate);
    }

    // ─── HELPERS ────────────────────────────────────────────────────────────

    private Map<String, Object> completedBooking(BigDecimal finalAmount) {
        return Map.of(
                "id", bookingId,
                "userId", userId,
                "status", "COMPLETED",
                "finalAmount", finalAmount);
    }

    private Transaction transaction(PaymentStatus status, String orderId, Long id) {
        Transaction t = new Transaction(userId, ReferenceType.BOOKING, bookingId,
                new BigDecimal("999.00"), "RAZORPAY");
        t.setId(id);
        t.setStatus(status);
        t.setGatewayTransactionId(orderId);
        return t;
    }

    private VerifyPaymentRequest verifyRequest(String orderId, String paymentId, String signature) {
        VerifyPaymentRequest req = new VerifyPaymentRequest();
        req.setRazorpayOrderId(orderId);
        req.setRazorpayPaymentId(paymentId);
        req.setRazorpaySignature(signature);
        return req;
    }

    private String capturedWebhook(String orderId, String paymentId, long amountPaise, String method) {
        return "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{"
                + "\"id\":\"" + paymentId + "\","
                + "\"order_id\":\"" + orderId + "\","
                + "\"amount\":" + amountPaise + ","
                + "\"method\":\"" + method + "\","
                + "\"status\":\"captured\"}}}}";
    }

    // ─── CREATE ORDER ───────────────────────────────────────────────────────

    @Test
    void createOrder_ForCompletedBooking_ShouldCreateRazorpayOrder() {
        when(bookingServiceClient.getBooking(bookingId, "Bearer abc"))
                .thenReturn(completedBooking(new BigDecimal("999.00")));
        when(transactionRepository.existsByReferenceTypeAndReferenceIdAndStatusIn(
                any(), any(), anyCollection())).thenReturn(false);
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        // The receipt embeds the DB-generated transaction id (null in the mock)
        when(gateway.createOrder(eq(new BigDecimal("999.00")), eq("INR"), anyString()))
                .thenReturn(new GatewayResult("order_Rzp123", "CREATED"));
        when(gateway.getKeyId()).thenReturn("rzp_test_keyid");

        CreateOrderResponse response = paymentService.createOrder(userId, bookingId, "Bearer abc");

        assertEquals(bookingId, response.bookingId());
        assertEquals("order_Rzp123", response.razorpayOrderId());
        assertEquals("rzp_test_keyid", response.razorpayKeyId());
        assertEquals(99900L, response.amount()); // ₹999.00 → 99900 paise
        assertEquals("INR", response.currency());
        assertEquals("INITIATED", response.status());

        // payment.initiated must be published so booking-service moves to PAYMENT_PENDING
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_INITIATED),
                any(Object.class));
    }

    @Test
    void createOrder_WhenBookingNotCompleted_ShouldReject() {
        Map<String, Object> booking = Map.of("id", bookingId, "userId", userId,
                "status", "PENDING", "finalAmount", new BigDecimal("999.00"));
        when(bookingServiceClient.getBooking(bookingId, "Bearer abc")).thenReturn(booking);

        assertThrows(BookingNotEligibleException.class,
                () -> paymentService.createOrder(userId, bookingId, "Bearer abc"));
        verify(gateway, never()).createOrder(any(), any(), any());
    }

    @Test
    void createOrder_WhenBookingHasNoAmount_ShouldReject() {
        when(bookingServiceClient.getBooking(bookingId, "Bearer abc"))
                .thenReturn(Map.of("id", bookingId, "userId", userId, "status", "COMPLETED"));

        assertThrows(BookingNotEligibleException.class,
                () -> paymentService.createOrder(userId, bookingId, "Bearer abc"));
    }

    @Test
    void createOrder_WhenBookingOwnedByAnotherUser_ShouldReject() {
        when(bookingServiceClient.getBooking(bookingId, "Bearer abc"))
                .thenReturn(Map.of("id", bookingId, "userId", otherUserId, "status", "COMPLETED",
                        "finalAmount", new BigDecimal("999.00")));

        assertThrows(TransactionNotOwnedException.class,
                () -> paymentService.createOrder(userId, bookingId, "Bearer abc"));
    }

    @Test
    void createOrder_WhenPaymentAlreadyExists_ShouldReject() {
        when(bookingServiceClient.getBooking(bookingId, "Bearer abc"))
                .thenReturn(completedBooking(new BigDecimal("999.00")));
        when(transactionRepository.existsByReferenceTypeAndReferenceIdAndStatusIn(
                any(), any(), anyCollection())).thenReturn(true);

        assertThrows(PaymentAlreadyProcessedException.class,
                () -> paymentService.createOrder(userId, bookingId, "Bearer abc"));
        verify(gateway, never()).createOrder(any(), any(), any());
    }

    @Test
    void createOrder_WhenRazorpayFails_ShouldMarkTransactionFailed() {
        when(bookingServiceClient.getBooking(bookingId, "Bearer abc"))
                .thenReturn(completedBooking(new BigDecimal("999.00")));
        when(transactionRepository.existsByReferenceTypeAndReferenceIdAndStatusIn(
                any(), any(), anyCollection())).thenReturn(false);
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(gateway.createOrder(any(), any(), any()))
                .thenThrow(new PaymentGatewayException("Razorpay order creation failed"));

        assertThrows(PaymentGatewayException.class,
                () -> paymentService.createOrder(userId, bookingId, "Bearer abc"));

        // The orphaned INITIATED transaction must be closed so the booking can retry
        verify(transactionRepository, atLeastOnce()).save(argThat(t ->
                ((Transaction) t).getStatus() == PaymentStatus.FAILED));
        verify(rabbitTemplate, never()).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_INITIATED), any(Object.class));
    }

    // ─── VERIFY ─────────────────────────────────────────────────────────────

    @Test
    void verifyPayment_WithValidSignature_ShouldMarkSuccess() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "order_Rzp123", 10L);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));
        when(gateway.verifyPaymentSignature("order_Rzp123", "pay_Rzp456", "sig123"))
                .thenReturn(true);
        when(gateway.fetchPayment("pay_Rzp456"))
                .thenReturn(new RazorpayGatewayService.RazorpayPaymentInfo(
                        "order_Rzp123", "captured", "upi", 99900L));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        VerifyPaymentResponse response = paymentService.verifyPayment(
                userId, verifyRequest("order_Rzp123", "pay_Rzp456", "sig123"));

        assertTrue(response.success());
        assertFalse(response.cancelled());
        assertEquals(PaymentStatus.SUCCESS, txn.getStatus());
        assertEquals("pay_Rzp456", txn.getRazorpayPaymentId());
        assertEquals("UPI", txn.getPaymentMethod());
        assertNotNull(txn.getPaidAt());

        verify(rabbitTemplate).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS), any(Object.class));
    }

    @Test
    void verifyPayment_WithInvalidSignature_ShouldReject() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "order_Rzp123", 10L);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));
        when(gateway.verifyPaymentSignature(any(), any(), any())).thenReturn(false);

        assertThrows(InvalidRazorpaySignatureException.class,
                () -> paymentService.verifyPayment(
                        userId, verifyRequest("order_Rzp123", "pay_Rzp456", "bad-sig")));
        verify(transactionRepository, never()).save(any());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    void verifyPayment_WhenPaymentNotCaptured_ShouldReject() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "order_Rzp123", 10L);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));
        when(gateway.verifyPaymentSignature(any(), any(), any())).thenReturn(true);
        when(gateway.fetchPayment("pay_Rzp456"))
                .thenReturn(new RazorpayGatewayService.RazorpayPaymentInfo(
                        "order_Rzp123", "failed", "upi", 99900L));

        assertThrows(InvalidRazorpaySignatureException.class,
                () -> paymentService.verifyPayment(
                        userId, verifyRequest("order_Rzp123", "pay_Rzp456", "sig123")));
    }

    @Test
    void verifyPayment_WhenAmountMismatches_ShouldReject() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "order_Rzp123", 10L);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));
        when(gateway.verifyPaymentSignature(any(), any(), any())).thenReturn(true);
        when(gateway.fetchPayment("pay_Rzp456"))
                .thenReturn(new RazorpayGatewayService.RazorpayPaymentInfo(
                        "order_Rzp123", "captured", "card", 1L)); // ₹0.01 instead of ₹999

        assertThrows(InvalidRazorpaySignatureException.class,
                () -> paymentService.verifyPayment(
                        userId, verifyRequest("order_Rzp123", "pay_Rzp456", "sig123")));
    }

    @Test
    void verifyPayment_NotOwner_ShouldReject() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "order_Rzp123", 10L);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));

        assertThrows(TransactionNotOwnedException.class,
                () -> paymentService.verifyPayment(
                        otherUserId, verifyRequest("order_Rzp123", "pay_Rzp456", "sig")));
    }

    @Test
    void verifyPayment_AlreadySuccess_ShouldBeIdempotent() {
        Transaction txn = transaction(PaymentStatus.SUCCESS, "order_Rzp123", 10L);
        txn.setRazorpayPaymentId("pay_Rzp456");
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));

        VerifyPaymentResponse response = paymentService.verifyPayment(
                userId, verifyRequest("order_Rzp123", "pay_Rzp456", "sig"));

        assertTrue(response.success());
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    void verifyPayment_WhenCheckoutDismissed_ShouldCloseForRetry() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "order_Rzp123", 10L);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        VerifyPaymentResponse response = paymentService.verifyPayment(
                userId, verifyRequest("order_Rzp123", "", ""));

        assertFalse(response.success());
        assertTrue(response.cancelled());
        assertEquals(PaymentStatus.FAILED, txn.getStatus());
        // Booking-service reverts the booking to COMPLETED for retry on payment.failed
        verify(rabbitTemplate).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_FAILED), any(Object.class));
    }

    @Test
    void verifyPayment_AfterCancelledCheckout_WithValidSignature_ShouldRecoverToSuccess() {
        // Race scenario: the checkout was dismissed (transaction FAILED) but the
        // payment was actually captured — the real signature must upgrade it.
        Transaction txn = transaction(PaymentStatus.FAILED, "order_Rzp123", 10L);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));
        when(gateway.verifyPaymentSignature("order_Rzp123", "pay_Rzp456", "sig123"))
                .thenReturn(true);
        when(gateway.fetchPayment("pay_Rzp456"))
                .thenReturn(new RazorpayGatewayService.RazorpayPaymentInfo(
                        "order_Rzp123", "captured", "card", 99900L));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        VerifyPaymentResponse response = paymentService.verifyPayment(
                userId, verifyRequest("order_Rzp123", "pay_Rzp456", "sig123"));

        assertTrue(response.success());
        assertEquals(PaymentStatus.SUCCESS, txn.getStatus());
        assertEquals("pay_Rzp456", response.razorpayPaymentId());
        assertEquals("pay_Rzp456", response.transactionId());
        verify(rabbitTemplate).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS), any(Object.class));
    }

    // ─── WEBHOOK ────────────────────────────────────────────────────────────

    @Test
    void handleWebhook_WithInvalidSignature_ShouldReject() {
        when(gateway.verifyWebhookSignature(anyString(), anyString())).thenReturn(false);

        assertThrows(InvalidRazorpaySignatureException.class,
                () -> paymentService.handleWebhook("{}", "bad-signature"));
    }

    @Test
    void handleWebhook_Captured_ShouldMarkSuccess() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "order_Rzp123", 10L);
        when(gateway.verifyWebhookSignature(anyString(), anyString())).thenReturn(true);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = paymentService.handleWebhook(
                capturedWebhook("order_Rzp123", "pay_Wbhk1", 99900L, "netbanking"), "sig");

        assertEquals("processed", result.get("status"));
        assertEquals("SUCCESS", result.get("transactionStatus"));
        assertEquals(PaymentStatus.SUCCESS, txn.getStatus());
        assertEquals("pay_Wbhk1", txn.getRazorpayPaymentId());
        assertEquals("NETBANKING", txn.getPaymentMethod());
        assertNotNull(txn.getPaidAt());
        verify(rabbitTemplate).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS), any(Object.class));
    }

    @Test
    void handleWebhook_Failed_ShouldMarkFailed() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "order_Rzp123", 10L);
        when(gateway.verifyWebhookSignature(anyString(), anyString())).thenReturn(true);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        String failedBody = capturedWebhook("order_Rzp123", "pay_Wbhk2", 99900L, "card")
                .replace("payment.captured", "payment.failed");

        Map<String, Object> result = paymentService.handleWebhook(failedBody, "sig");

        assertEquals("FAILED", result.get("transactionStatus"));
        assertEquals(PaymentStatus.FAILED, txn.getStatus());
        verify(rabbitTemplate).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_FAILED), any(Object.class));
    }

    @Test
    void handleWebhook_DuplicateEvent_ShouldBeIdempotent() {
        Transaction txn = transaction(PaymentStatus.SUCCESS, "order_Rzp123", 10L);
        when(gateway.verifyWebhookSignature(anyString(), anyString())).thenReturn(true);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));

        Map<String, Object> result = paymentService.handleWebhook(
                capturedWebhook("order_Rzp123", "pay_Wbhk1", 99900L, "upi"), "sig");

        assertEquals("already_processed", result.get("status"));
        // No duplicate events → no double commission / double mechanic earning
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    void handleWebhook_Captured_AfterCancelledCheckout_ShouldUpgradeToSuccess() {
        // A payment.captured webhook is authoritative: it upgrades a transaction
        // that was closed as cancelled (FAILED) when the capture raced the dismiss.
        Transaction txn = transaction(PaymentStatus.FAILED, "order_Rzp123", 10L);
        when(gateway.verifyWebhookSignature(anyString(), anyString())).thenReturn(true);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = paymentService.handleWebhook(
                capturedWebhook("order_Rzp123", "pay_Wbhk1", 99900L, "upi"), "sig");

        assertEquals("processed", result.get("status"));
        assertEquals("SUCCESS", result.get("transactionStatus"));
        assertEquals(PaymentStatus.SUCCESS, txn.getStatus());
        assertEquals("pay_Wbhk1", txn.getRazorpayPaymentId());
        verify(rabbitTemplate).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS), any(Object.class));
    }

    @Test
    void handleWebhook_AmountMismatch_ShouldFailTransaction() {
        Transaction txn = transaction(PaymentStatus.INITIATED, "order_Rzp123", 10L);
        when(gateway.verifyWebhookSignature(anyString(), anyString())).thenReturn(true);
        when(transactionRepository.findByGatewayTransactionId("order_Rzp123"))
                .thenReturn(Optional.of(txn));
        when(transactionRepository.save(any(Transaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = paymentService.handleWebhook(
                capturedWebhook("order_Rzp123", "pay_Wbhk1", 1L, "upi"), "sig");

        assertEquals("amount_mismatch", result.get("status"));
        assertEquals(PaymentStatus.FAILED, txn.getStatus());
        verify(rabbitTemplate).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_PAYMENT_FAILED), any(Object.class));
    }

    @Test
    void handleWebhook_UnknownOrder_ShouldReject() {
        when(gateway.verifyWebhookSignature(anyString(), anyString())).thenReturn(true);
        when(transactionRepository.findByGatewayTransactionId("order_Unknown"))
                .thenReturn(Optional.empty());

        assertThrows(TransactionNotFoundException.class,
                () -> paymentService.handleWebhook(
                        capturedWebhook("order_Unknown", "pay_Wbhk1", 99900L, "upi"), "sig"));
    }
}
