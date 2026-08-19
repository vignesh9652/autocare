package com.autocare.paymentservice.dto;

import java.math.BigDecimal;

/**
 * Result of {@code POST /api/payments/verify}. {@code success} is true only
 * when the Razorpay signature verified and the payment was captured.
 * {@code cancelled} is true when the checkout was dismissed without paying
 * (transaction closed so the booking can be retried).
 *
 * <p>{@code transactionId} is the Razorpay <b>payment</b> id ({@code pay_…})
 * when available, falling back to the order id.</p>
 */
public record VerifyPaymentResponse(
        boolean success,
        boolean cancelled,
        Long paymentId,
        Long bookingId,
        String transactionId,
        String razorpayPaymentId,
        String paymentMethod,
        BigDecimal amount,
        String status
) {
}
