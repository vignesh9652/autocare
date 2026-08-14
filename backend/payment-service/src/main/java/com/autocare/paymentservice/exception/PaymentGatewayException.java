package com.autocare.paymentservice.exception;

/**
 * Thrown when the Razorpay API rejects a request or the gateway is not
 * configured (missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).
 */
public class PaymentGatewayException extends RuntimeException {
    public PaymentGatewayException(String message) {
        super(message);
    }

    public PaymentGatewayException(String message, Throwable cause) {
        super(message, cause);
    }
}
