package com.autocare.paymentservice.exception;

/**
 * Thrown when a booking is not eligible for payment, e.g. it is not in
 * COMPLETED status or has no payable amount.
 */
public class BookingNotEligibleException extends RuntimeException {
    public BookingNotEligibleException(String message) {
        super(message);
    }
}
