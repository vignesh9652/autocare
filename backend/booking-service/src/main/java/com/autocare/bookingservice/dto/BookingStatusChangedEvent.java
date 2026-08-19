package com.autocare.bookingservice.dto;

import com.autocare.bookingservice.entity.BookingStatus;

/**
 * Published whenever a booking's status changes through a user action
 * (mechanic accepted/rejected/started, customer cancelled). Consumed by
 * notification-service so both sides are kept in the loop in real time.
 */
public class BookingStatusChangedEvent {

    private Long bookingId;
    private Long userId;
    private Long mechanicId;
    private Long mechanicUserId;
    private String serviceType;
    private BookingStatus newStatus;

    public BookingStatusChangedEvent() {
    }

    public BookingStatusChangedEvent(Long bookingId, Long userId, Long mechanicId,
                                     Long mechanicUserId, String serviceType,
                                     BookingStatus newStatus) {
        this.bookingId = bookingId;
        this.userId = userId;
        this.mechanicId = mechanicId;
        this.mechanicUserId = mechanicUserId;
        this.serviceType = serviceType;
        this.newStatus = newStatus;
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

    public Long getMechanicUserId() {
        return mechanicUserId;
    }

    public void setMechanicUserId(Long mechanicUserId) {
        this.mechanicUserId = mechanicUserId;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public BookingStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(BookingStatus newStatus) {
        this.newStatus = newStatus;
    }
}
