package com.autocare.paymentservice.gateway;

import com.autocare.paymentservice.dto.WebhookPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.UUID;

/**
 * Simulated payment gateway for local development.
 *
 * <p>Returns a deterministic-looking fake {@code gatewayTransactionId} and
 * marks the payment as pending authorization. It also signs webhook payloads
 * with an HMAC-SHA256 signature so the webhook endpoint can be tested end-to-end
 * (see {@link #computeSignature(String, String)}).
 *
 * <p>Replace this class with a real gateway adapter (see {@link PaymentGateway})
 * when integrating Razorpay / Stripe.
 */
@Component
public class MockGatewayService implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(MockGatewayService.class);

    public static final String STATUS_PENDING = "PENDING";

    private final String webhookSecret;

    public MockGatewayService(@Value("${app.webhook.secret}") String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }

    @Override
    public GatewayResult initiate(BigDecimal amount, String currency, String paymentMethod) {
        // Fake gateway id, e.g. pay_mock_3f9c2ab81de4
        String gatewayTransactionId = "pay_mock_"
                + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        log.info("💳 [MOCK GATEWAY] Payment initiated: {} {} via {} -> {}", amount, currency, paymentMethod, gatewayTransactionId);

        // In a real gateway the status would be PENDING until the user completes
        // the payment and the gateway sends a webhook with the final status.
        return new GatewayResult(gatewayTransactionId, STATUS_PENDING);
    }

    @Override
    public boolean verifyWebhookSignature(WebhookPayload payload) {
        if (payload.getGatewayTransactionId() == null
                || payload.getStatus() == null
                || payload.getSignature() == null) {
            return false;
        }

        String expected = computeSignature(payload.getGatewayTransactionId(), payload.getStatus());
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                payload.getSignature().getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Computes the HMAC-SHA256 signature the (mock) gateway would attach to a
     * webhook payload. Exposed so the payment flow can be tested end-to-end:
     * simulate a gateway callback with a valid signature.
     */
    public String computeSignature(String gatewayTransactionId, String status) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String data = gatewayTransactionId + "." + status;
            return Base64.getEncoder().encodeToString(
                    mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Failed to sign webhook payload", e);
        }
    }
}
