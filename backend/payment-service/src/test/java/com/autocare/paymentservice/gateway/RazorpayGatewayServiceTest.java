package com.autocare.paymentservice.gateway;

import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies the Razorpay HMAC-SHA256 signature algorithms match the official
 * scheme (hex-encoded HMAC of {@code orderId|paymentId} / raw webhook body).
 */
class RazorpayGatewayServiceTest {

    private static final String KEY_SECRET = "test_key_secret_123";
    private static final String WEBHOOK_SECRET = "test_webhook_secret_456";

    private final RazorpayGatewayService gateway =
            new RazorpayGatewayService("rzp_test_keyid", KEY_SECRET, WEBHOOK_SECRET, null);

    @Test
    void verifyPaymentSignature_WithValidSignature_ShouldPass() {
        String orderId = "order_Test123";
        String paymentId = "pay_Test456";
        String signature = hmacHex(KEY_SECRET, orderId + "|" + paymentId);

        assertTrue(gateway.verifyPaymentSignature(orderId, paymentId, signature));
    }

    @Test
    void verifyPaymentSignature_WithTamperedSignature_ShouldFail() {
        String orderId = "order_Test123";
        String paymentId = "pay_Test456";
        String signature = hmacHex(KEY_SECRET, orderId + "|" + paymentId + "x"); // tampered

        assertFalse(gateway.verifyPaymentSignature(orderId, paymentId, signature));
    }

    @Test
    void verifyPaymentSignature_WithMissingValues_ShouldFail() {
        assertFalse(gateway.verifyPaymentSignature(null, "pay_1", "sig"));
        assertFalse(gateway.verifyPaymentSignature("order_1", null, "sig"));
        assertFalse(gateway.verifyPaymentSignature("order_1", "pay_1", null));
    }

    @Test
    void verifyWebhookSignature_WithValidBody_ShouldPass() {
        String rawBody = "{\"event\":\"payment.captured\",\"payload\":{}}";
        String signature = hmacHex(WEBHOOK_SECRET, rawBody);

        assertTrue(gateway.verifyWebhookSignature(rawBody, signature));
    }

    @Test
    void verifyWebhookSignature_WithTamperedBody_ShouldFail() {
        String rawBody = "{\"event\":\"payment.captured\",\"payload\":{}}";
        String signature = hmacHex(WEBHOOK_SECRET, rawBody + " "); // body changed

        assertFalse(gateway.verifyWebhookSignature(rawBody, signature));
    }

    @Test
    void verifyWebhookSignature_WithEmptySecret_ShouldFail() {
        RazorpayGatewayService noSecret =
                new RazorpayGatewayService("rzp_test_keyid", KEY_SECRET, "", null);
        assertFalse(noSecret.verifyWebhookSignature("{}", "anything"));
    }

    private String hmacHex(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
