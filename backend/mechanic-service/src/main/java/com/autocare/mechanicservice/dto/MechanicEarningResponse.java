package com.autocare.mechanicservice.dto;

import com.autocare.mechanicservice.entity.EarningStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MechanicEarningResponse {

    private Long id;
    private Long bookingId;
    private Long paymentId;
    private BigDecimal serviceAmount;
    private BigDecimal platformCommission;
    private BigDecimal mechanicEarning;
    private EarningStatus earningStatus;
    private LocalDateTime createdAt;

    public MechanicEarningResponse() {
    }

    public MechanicEarningResponse(Long id, Long bookingId, Long paymentId,
                                   BigDecimal serviceAmount, BigDecimal platformCommission,
                                   BigDecimal mechanicEarning, EarningStatus earningStatus,
                                   LocalDateTime createdAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.paymentId = paymentId;
        this.serviceAmount = serviceAmount;
        this.platformCommission = platformCommission;
        this.mechanicEarning = mechanicEarning;
        this.earningStatus = earningStatus;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
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

    public EarningStatus getEarningStatus() {
        return earningStatus;
    }

    public void setEarningStatus(EarningStatus earningStatus) {
        this.earningStatus = earningStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
