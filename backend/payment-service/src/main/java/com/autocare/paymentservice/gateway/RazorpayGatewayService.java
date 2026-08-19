package com.autocare.paymentservice.gateway;

import com.autocare.paymentservice.exception.PaymentGatewayException;
import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Real Razorpay gateway adapter (TEST MODE). Replaces the {@link MockGatewayService}
 * for the booking payment flow while keeping the same {@link PaymentGateway}
 * seam for the legacy mock endpoints.
 *
 * <p>Secrets are injected from environment variables only
 * ({@code RAZORPAY_KEY_ID}, {@code RAZORPAY_KEY_SECRET},
 * {@code RAZORPAY_WEBHOOK_SECRET}) — never hardcoded, never logged.</p>
 *
 * <p>Signature verification follows the official Razorpay algorithms:</p>
 * <ul>
 *   <li><b>Payment</b>: HMAC-SHA256 of {@code order_id + "|" + payment_id}
 *       keyed with the key secret, hex-encoded, compared constant-time.</li>
 *   <li><b>Webhook</b>: HMAC-SHA256 of the <b>raw request body</b> keyed with
 *       the webhook secret, hex-encoded, compared constant-time.</li>
 * </ul>
 */
@Component
public class RazorpayGatewayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayGatewayService.class);

    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private volatile RazorpayClient client;

    @Autowired
    public RazorpayGatewayService(@Value("${razorpay.key-id:}") String keyId,
                                  @Value("${razorpay.key-secret:}") String keySecret,
                                  @Value("${razorpay.webhook-secret:}") String webhookSecret) {
        this(keyId, keySecret, webhookSecret, null);
    }

    /** Package-private for tests — allows injecting a mocked RazorpayClient. */
    RazorpayGatewayService(String keyId, String keySecret, String webhookSecret, RazorpayClient client) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = webhookSecret;
        this.client = client;
    }

    /**
     * Lazy client so the service boots (and the legacy mock flow keeps
     * working) even when Razorpay env vars are not configured yet.
     */
    private RazorpayClient client() {
        RazorpayClient current = client;
        if (current == null) {
            synchronized (this) {
                current = client;
                if (current == null) {
                    try {
                        current = new RazorpayClient(keyId, keySecret);
                    } catch (RazorpayException e) {
                        throw new PaymentGatewayException("Failed to initialize Razorpay client", e);
                    }
                    client = current;
                }
            }
        }
        return current;
    }

    public String getKeyId() {
        return keyId;
    }

    /**
     * Creates a Razorpay order for the given amount. The amount is converted
     * to paise (₹999.00 → 99900) — the only unit Razorpay accepts.
     *
     * @return the Razorpay order id ({@code order_…})
     */
    public GatewayResult createOrder(BigDecimal amount, String currency, String receipt) {
        if (!StringUtils.hasText(keyId) || !StringUtils.hasText(keySecret)) {
            throw new PaymentGatewayException(
                    "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET "
                            + "before creating orders.");
        }

        long paise = amount.multiply(BigDecimal.valueOf(100)).longValueExact();
        if (paise <= 0) {
            throw new PaymentGatewayException("Invalid amount for Razorpay order: " + amount);
        }

        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", paise);
        orderRequest.put("currency", StringUtils.hasText(currency) ? currency : "INR");
        orderRequest.put("receipt", receipt);
        // Auto-capture: money is settled as soon as the customer completes payment
        orderRequest.put("payment_capture", 1);

        try {
            Order order = client().orders.create(orderRequest);
            // Note: com.razorpay.Entity.get(String) is generic (<T> T), so
            // String.valueOf(order.get("id")) makes javac infer T = char[] and
            // inject a checkcast to char[] which fails at runtime with a
            // ClassCastException. Cast to String explicitly to pin T = String.
            String orderId = (String) order.get("id");
            log.info("💳 [RAZORPAY] Order created: {} ({} {} paise, receipt {})",
                    orderId, paise, orderRequest.get("currency"), receipt);
            return new GatewayResult(orderId, "CREATED");
        } catch (RazorpayException e) {
            log.error("❌ [RAZORPAY] Order creation failed", e);
            throw new PaymentGatewayException("Razorpay order creation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Fetches a captured payment from Razorpay. Used during verification to
     * confirm the payment was actually captured and the amount matches.
     */
    public RazorpayPaymentInfo fetchPayment(String paymentId) {
        try {
            Payment payment = client().payments.fetch(paymentId);
            String orderId = (String) payment.get("order_id");
            String status = (String) payment.get("status");
            String method = (String) payment.get("method");
            long amountPaise = ((Number) payment.get("amount")).longValue();
            return new RazorpayPaymentInfo(orderId, status, method, amountPaise);
        } catch (RazorpayException e) {
            log.warn("⚠️ [RAZORPAY] Could not fetch payment {}: {}", paymentId, e.getMessage());
            throw new PaymentGatewayException("Could not fetch payment " + paymentId + " from Razorpay", e);
        }
    }

    /**
     * Verifies the payment signature returned by the Razorpay Checkout SDK:
     * HMAC-SHA256(order_id | payment_id, key_secret), hex-encoded.
     */
    public boolean verifyPaymentSignature(String orderId, String paymentId, String signature) {
        if (orderId == null || paymentId == null || signature == null) {
            return false;
        }
        String expected = hmacHex(keySecret, orderId + "|" + paymentId);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Verifies a Razorpay webhook signature: HMAC-SHA256 of the <b>raw</b>
     * request body keyed with the webhook secret, hex-encoded, compared
     * against the {@code X-Razorpay-Signature} header.
     */
    public boolean verifyWebhookSignature(String rawBody, String signature) {
        if (rawBody == null || signature == null || !StringUtils.hasText(webhookSecret)) {
            return false;
        }
        String expected = hmacHex(webhookSecret, rawBody);
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8));
    }

    private String hmacHex(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HMAC-SHA256 not available", e);
        }
    }

    /**
     * Razorpay payment details used during verification.
     *
     * @param orderId      Razorpay order id the payment belongs to
     * @param status       gateway status ("captured", "failed", "authorized", …)
     * @param method       payment method code ("upi", "card", "netbanking", …)
     * @param amountPaise  captured amount in paise
     */
    public record RazorpayPaymentInfo(String orderId, String status, String method, long amountPaise) {
    }
}
