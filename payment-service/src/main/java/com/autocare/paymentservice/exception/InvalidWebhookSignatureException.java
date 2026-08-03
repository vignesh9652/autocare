package com.autocare.paymentservice.exception;

public class InvalidWebhookSignatureException extends RuntimeException {
    public InvalidWebhookSignatureException(String message) {
        super(message);
    }
}
