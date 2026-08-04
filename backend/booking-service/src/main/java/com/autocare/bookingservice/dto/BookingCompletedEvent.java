package com.autocare.bookingservice.dto;

public class BookingCompletedEvent {

    private Long bookingId;
    private Long userId;
    private Long mechanicId;
    private String serviceType;

    public BookingCompletedEvent() {}

    public BookingCompletedEvent(Long bookingId, Long userId, Long mechanicId,
                                 String serviceType) {
        this.bookingId = bookingId;
        this.userId = userId;
        this.mechanicId = mechanicId;
        this.serviceType = serviceType;
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
}
