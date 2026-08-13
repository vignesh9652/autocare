package com.autocare.paymentservice.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request body for {@code POST /api/payments/create-order}.
 *
 * <p>Only the booking id is trusted — the amount is always resolved
 * server-side from the booking's final amount, never from the client.</p>
 */
public class CreateOrderRequest {

    @NotNull(message = "Booking id is required")
    private Long bookingId;

    public CreateOrderRequest() {
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }
}
