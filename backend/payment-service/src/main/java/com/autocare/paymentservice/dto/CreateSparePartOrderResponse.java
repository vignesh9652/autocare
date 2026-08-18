package com.autocare.paymentservice.dto;

/**
 * Razorpay checkout payload returned to the frontend after
 * {@code POST /api/payments/create-spare-part-order}.
 * {@code amount} is in paise (₹999.00 → 99900) as required by the
 * Razorpay Checkout SDK.
 *
 * <p>Only the public Razorpay key id is ever exposed — the secret stays on
 * the backend.</p>
 */
public record CreateSparePartOrderResponse(
        Long paymentId,
        Long orderId,
        String razorpayOrderId,
        String razorpayKeyId,
        long amount,
        String currency,
        String status
) {
}
