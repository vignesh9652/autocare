package com.autocare.vehicleservice.exception;

public class VehicleNotOwnedException extends RuntimeException {
    public VehicleNotOwnedException(String message) {
        super(message);
    }
}
