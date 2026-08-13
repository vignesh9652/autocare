package com.autocare.paymentservice.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request body for {@code POST /api/payments/verify}. Carries the values
 * Razorpay returns to the checkout handler.
 *
 * <p>{@code razorpayPaymentId}/{@code razorpaySignature} may be blank when the
 * customer dismissed the checkout without paying — the backend then closes
 * the pending transaction so the booking can be retried.</p>
 */
public class VerifyPaymentRequest {

    @NotBlank(message = "Razorpay order id is required")
    private String razorpayOrderId;

    private String razorpayPaymentId;

    private String razorpaySignature;

    public VerifyPaymentRequest() {
    }

    public String getRazorpayOrderId() {
        return razorpayOrderId;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public String getRazorpayPaymentId() {
        return razorpayPaymentId;
    }

    public void setRazorpayPaymentId(String razorpayPaymentId) {
        this.razorpayPaymentId = razorpayPaymentId;
    }

    public String getRazorpaySignature() {
        return razorpaySignature;
    }

    public void setRazorpaySignature(String razorpaySignature) {
        this.razorpaySignature = razorpaySignature;
    }
}
