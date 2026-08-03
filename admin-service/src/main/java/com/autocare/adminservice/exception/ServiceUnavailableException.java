package com.autocare.adminservice.exception;

/**
 * Thrown when a downstream service call (guarded by a circuit breaker) is not
 * available and the calling endpoint has no meaningful partial result to
 * return (e.g. the /api/admin/bookings proxy list). Mapped to HTTP 503.
 */
public class ServiceUnavailableException extends RuntimeException {

    public ServiceUnavailableException(String message) {
        super(message);
    }
}
