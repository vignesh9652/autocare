package com.autocare.mechanicservice.exception;

public class MechanicNotOwnedException extends RuntimeException {
    public MechanicNotOwnedException(String message) {
        super(message);
    }
}
