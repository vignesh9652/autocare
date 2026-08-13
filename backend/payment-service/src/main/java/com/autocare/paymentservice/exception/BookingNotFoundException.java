package com.autocare.paymentservice.exception;

/** Thrown when the referenced booking does not exist. */
public class BookingNotFoundException extends RuntimeException {
    public BookingNotFoundException(String message) {
        super(message);
    }
}
