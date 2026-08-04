package com.autocare.paymentservice.controller;

import com.autocare.paymentservice.dto.PaymentRequest;
import com.autocare.paymentservice.dto.PaymentResponse;
import com.autocare.paymentservice.dto.WebhookPayload;
import com.autocare.paymentservice.service.PaymentService;
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

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
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
