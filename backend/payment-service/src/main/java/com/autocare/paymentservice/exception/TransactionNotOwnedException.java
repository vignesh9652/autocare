package com.autocare.paymentservice.exception;

public class TransactionNotOwnedException extends RuntimeException {
    public TransactionNotOwnedException(String message) {
        super(message);
    }
}
