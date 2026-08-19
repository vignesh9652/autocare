package com.autocare.paymentservice.exception;

/**
 * Thrown when a Razorpay payment/webhook signature fails verification,
 * meaning the payload did not genuinely come from Razorpay.
 */
public class InvalidRazorpaySignatureException extends RuntimeException {
    public InvalidRazorpaySignatureException(String message) {
        super(message);
    }
}
