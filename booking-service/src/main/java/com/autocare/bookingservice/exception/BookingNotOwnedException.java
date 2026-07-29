package com.autocare.bookingservice.exception;

public class BookingNotOwnedException extends RuntimeException {
    public BookingNotOwnedException(String message) {
        super(message);
    }
}
