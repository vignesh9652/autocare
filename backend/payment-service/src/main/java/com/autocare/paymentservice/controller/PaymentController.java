package com.autocare.paymentservice.controller;

import com.autocare.paymentservice.dto.*;
import com.autocare.paymentservice.service.PaymentService;
import com.autocare.paymentservice.service.RazorpayPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final RazorpayPaymentService razorpayPaymentService;

    public PaymentController(PaymentService paymentService,
                             RazorpayPaymentService razorpayPaymentService) {
        this.paymentService = paymentService;
        this.razorpayPaymentService = razorpayPaymentService;
    }

    // ─── Razorpay booking payment flow ─────────────────────────────────────

    /**
     * Creates a Razorpay order for a completed booking. The amount is resolved
     * server-side from the booking's final amount — the client only sends the
     * booking id and its JWT.
     */
    @PostMapping("/create-order")
    public ResponseEntity<CreateOrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        CreateOrderResponse response =
                razorpayPaymentService.createOrder(userId, request.getBookingId(), authHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Creates a Razorpay order for a spare-part purchase. The amount is resolved
     * server-side from the order's totalAmount — the client only sends the order
     * id and its JWT.
     */
    @PostMapping("/create-spare-part-order")
    public ResponseEntity<CreateSparePartOrderResponse> createSparePartOrder(
            @Valid @RequestBody CreateSparePartOrderRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        CreateSparePartOrderResponse response =
                razorpayPaymentService.createSparePartOrder(userId, request.getOrderId(), authHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Verifies the Razorpay signature returned by the Checkout SDK, marks the
     * payment SUCCESS and notifies booking-service (booking → PAID, commission
     * + mechanic earning recorded). Idempotent for already-finalized payments.
     */
    @PostMapping("/verify")
    public ResponseEntity<VerifyPaymentResponse> verifyPayment(
            @Valid @RequestBody VerifyPaymentRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(razorpayPaymentService.verifyPayment(userId, request));
    }

    /**
     * Razorpay webhook callback. Public endpoint — authentication is done via
     * the X-Razorpay-Signature header (verified over the raw body), not a JWT.
     */
    @PostMapping("/webhook/razorpay")
    public ResponseEntity<Map<String, Object>> handleRazorpayWebhook(
            @RequestBody String body,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        return ResponseEntity.ok(razorpayPaymentService.handleWebhook(body, signature));
    }

    /**
     * Initiate a payment. Creates a Transaction in INITIATED state and
     * obtains a gateway transaction id from the (mock) gateway.
     */
    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(
            @Valid @RequestBody PaymentRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        PaymentResponse response = paymentService.createPayment(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Development-only simulation of the gateway's final status callback.
     * Marks an owned, not-yet-finalized transaction SUCCESS or FAILED and
     * publishes the matching payment event. Rejects repeat processing.
     *
     * In production this finalization arrives via the webhook instead.
     */
    @PostMapping("/{id}/process")
    public ResponseEntity<Map<String, Object>> processTransaction(
            @PathVariable Long id,
            @Valid @RequestBody PaymentProcessRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(paymentService.processTransaction(id, userId, request.getStatus()));
    }

    /**
     * Gateway webhook callback. Public endpoint - authentication is done via
     * the webhook signature instead of a JWT.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @Valid @RequestBody WebhookPayload payload) {
        return ResponseEntity.ok(paymentService.processWebhook(payload));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getTransaction(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        PaymentResponse response = paymentService.getTransaction(id, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getUserTransactions(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<PaymentResponse> transactions = paymentService.getUserTransactions(userId);
        return ResponseEntity.ok(transactions);
    }

    /**
     * All transactions across all users. Admin-only — requires the ADMIN role
     * (enforced by SecurityConfig). Consumed by the admin-service aggregation
     * layer (PaymentServiceClient).
     */
    @GetMapping("/admin/all")
    public ResponseEntity<List<PaymentResponse>> getAllTransactions() {
        List<PaymentResponse> transactions = paymentService.getAllTransactions();
        return ResponseEntity.ok(transactions);
    }
}
