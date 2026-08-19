package com.autocare.bookingservice.entity;

public enum BookingStatus {
    PENDING,
    ACCEPTED,
    IN_PROGRESS,
    COMPLETED,
    /** Service completed; customer has initiated payment (transient). */
    PAYMENT_PENDING,
    /** Service completed and paid through the AutoCare platform. */
    PAID,
    REJECTED,
    CANCELLED
}
