package com.autocare.paymentservice.gateway;

import com.autocare.paymentservice.dto.WebhookPayload;

import java.math.BigDecimal;

/**
 * Abstraction over a payment gateway (Razorpay, Stripe, etc.).
 *
 * <p>The only production implementation today is {@link MockGatewayService},
 * which simulates the gateway for local development. To go live, implement
 * this interface with the real SDK calls, e.g.:
 *
 * <pre>
 *   RazorpayClient client = new RazorpayClient(keyId, keySecret);
 *   com.razorpay.Order order = client.orders.create(new JSONObject()
 *       .put("amount", amount.multiply(BigDecimal.valueOf(100)).longValue())
 *       .put("currency", currency)
 *       .put("payment_capture", 1));
 *   return new GatewayResult(order.get("id"), "PENDING");
 * </pre>
 */
public interface PaymentGateway {

    /**
     * Creates a payment/order at the gateway and returns a gateway-side id
     * that will be used to identify the transaction in webhook callbacks.
     */
    GatewayResult initiate(BigDecimal amount, String currency, String paymentMethod);

    /**
     * Verifies that an incoming webhook payload really came from the gateway
     * (e.g. HMAC signature check). Rejecting invalid signatures prevents
     * forged success/failure callbacks.
     */
    boolean verifyWebhookSignature(WebhookPayload payload);
}
