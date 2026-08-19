package com.autocare.sparepartsservice.exception;

public class OrderNotOwnedException extends RuntimeException {

    public OrderNotOwnedException(String message) {
        super(message);
    }
}
