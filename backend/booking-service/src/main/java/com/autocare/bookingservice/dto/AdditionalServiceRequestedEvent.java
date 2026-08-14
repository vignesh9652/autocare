package com.autocare.bookingservice.dto;

import java.math.BigDecimal;

/**
 * Published when a mechanic recommends an additional service. Consumed by
 * notification-service to alert the customer that their approval is needed.
 */
public class AdditionalServiceRequestedEvent {

    private Long bookingId;
    private Long customerId;
    private Long mechanicUserId;
    private Long serviceId;
    private String serviceName;
    private String reason;
    private BigDecimal amount;
    /** Original estimate + this additional amount (shown to the customer). */
    private BigDecimal newTotal;

    public AdditionalServiceRequestedEvent() {
    }

    public AdditionalServiceRequestedEvent(Long bookingId, Long customerId, Long mechanicUserId,
                                           Long serviceId, String serviceName, String reason,
                                           BigDecimal amount, BigDecimal newTotal) {
        this.bookingId = bookingId;
        this.customerId = customerId;
        this.mechanicUserId = mechanicUserId;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.reason = reason;
        this.amount = amount;
        this.newTotal = newTotal;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getMechanicUserId() {
        return mechanicUserId;
    }

    public void setMechanicUserId(Long mechanicUserId) {
        this.mechanicUserId = mechanicUserId;
    }

    public Long getServiceId() {
        return serviceId;
    }

    public void setServiceId(Long serviceId) {
        this.serviceId = serviceId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getNewTotal() {
        return newTotal;
    }

    public void setNewTotal(BigDecimal newTotal) {
        this.newTotal = newTotal;
    }
}
