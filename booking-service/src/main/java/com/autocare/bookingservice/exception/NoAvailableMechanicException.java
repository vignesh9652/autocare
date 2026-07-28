package com.autocare.bookingservice.exception;

public class NoAvailableMechanicException extends RuntimeException {
    public NoAvailableMechanicException(String message) {
        super(message);
    }
}
