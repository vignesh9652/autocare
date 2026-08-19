package com.autocare.bookingservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Mechanic → additional-service request. Only the booking and the catalogue
 * service are sent; the price is always resolved server-side from the
 * catalogue. An arbitrary {@code amount} is never accepted.
 */
public class AdditionalServiceCreateRequest {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    @NotBlank(message = "Reason is required")
    private String reason;

    public AdditionalServiceCreateRequest() {
    }

    public AdditionalServiceCreateRequest(Long bookingId, Long serviceId, String reason) {
        this.bookingId = bookingId;
        this.serviceId = serviceId;
        this.reason = reason;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
