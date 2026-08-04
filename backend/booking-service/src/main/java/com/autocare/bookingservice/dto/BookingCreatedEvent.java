package com.autocare.bookingservice.dto;

import java.time.LocalDateTime;

public class BookingCreatedEvent {

    private Long bookingId;
    private Long userId;
    private Long mechanicId;
    private String serviceType;
    private LocalDateTime scheduledAt;

    public BookingCreatedEvent() {}

    public BookingCreatedEvent(Long bookingId, Long userId, Long mechanicId,
                               String serviceType, LocalDateTime scheduledAt) {
        this.bookingId = bookingId;
        this.userId = userId;
        this.mechanicId = mechanicId;
        this.serviceType = serviceType;
        this.scheduledAt = scheduledAt;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getMechanicId() {
        return mechanicId;
    }

    public void setMechanicId(Long mechanicId) {
        this.mechanicId = mechanicId;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }
}
