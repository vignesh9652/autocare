package com.autocare.bookingservice.dto;

import java.math.BigDecimal;

/**
 * Published on the {@code booking.paid} routing key after a booking payment
 * succeeds. Carries the final money split so mechanic-service can record the
 * mechanic's earning for the completed job.
 */
public class BookingPaidEvent {

    private Long bookingId;
    private Long mechanicId;
    private Long paymentId;
    private BigDecimal serviceAmount;
    private BigDecimal platformCommission;
    private BigDecimal mechanicEarning;

    public BookingPaidEvent() {
    }

    public BookingPaidEvent(Long bookingId, Long mechanicId, Long paymentId,
                            BigDecimal serviceAmount, BigDecimal platformCommission,
                            BigDecimal mechanicEarning) {
        this.bookingId = bookingId;
        this.mechanicId = mechanicId;
        this.paymentId = paymentId;
        this.serviceAmount = serviceAmount;
        this.platformCommission = platformCommission;
        this.mechanicEarning = mechanicEarning;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getMechanicId() {
        return mechanicId;
    }

    public void setMechanicId(Long mechanicId) {
        this.mechanicId = mechanicId;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public BigDecimal getServiceAmount() {
        return serviceAmount;
    }

    public void setServiceAmount(BigDecimal serviceAmount) {
        this.serviceAmount = serviceAmount;
    }

    public BigDecimal getPlatformCommission() {
        return platformCommission;
    }

    public void setPlatformCommission(BigDecimal platformCommission) {
        this.platformCommission = platformCommission;
    }

    public BigDecimal getMechanicEarning() {
        return mechanicEarning;
    }

    public void setMechanicEarning(BigDecimal mechanicEarning) {
        this.mechanicEarning = mechanicEarning;
    }
}
