package com.autocare.sparepartsservice.exception;

public class SparePartNotFoundException extends RuntimeException {
    public SparePartNotFoundException(String message) {
        super(message);
    }
}
