package com.autocare.sparepartsservice.exception;

public class RecommendationAlreadyDecidedException extends RuntimeException {
    public RecommendationAlreadyDecidedException(String message) {
        super(message);
    }
}
