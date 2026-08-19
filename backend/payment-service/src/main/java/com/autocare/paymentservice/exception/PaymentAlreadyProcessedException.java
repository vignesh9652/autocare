package com.autocare.paymentservice.exception;

/**
 * Thrown when a payment is asked to be processed again after it already
 * reached a final state (SUCCESS or FAILED). Prevents double charging and
 * duplicate commission/earning events.
 */
public class PaymentAlreadyProcessedException extends RuntimeException {

    public PaymentAlreadyProcessedException(String message) {
        super(message);
    }
}
