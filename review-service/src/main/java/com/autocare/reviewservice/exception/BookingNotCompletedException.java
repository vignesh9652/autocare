package com.autocare.reviewservice.exception;

public class BookingNotCompletedException extends RuntimeException {

    public BookingNotCompletedException(String message) {
        super(message);
    }
}
