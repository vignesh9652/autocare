package com.autocare.reviewservice.exception;

public class BookingNotOwnedException extends RuntimeException {

    public BookingNotOwnedException(String message) {
        super(message);
    }
}
