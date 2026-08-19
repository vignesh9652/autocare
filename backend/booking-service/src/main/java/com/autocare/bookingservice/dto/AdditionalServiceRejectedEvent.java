package com.autocare.bookingservice.dto;

import java.math.BigDecimal;

/**
 * Published when a customer rejects an additional-service request. Consumed
 * by notification-service to tell the mechanic not to perform the work.
 */
public class AdditionalServiceRejectedEvent {

    private Long bookingId;
    private Long mechanicUserId;
    private Long requestId;
    private String serviceName;
    private BigDecimal amount;

    public AdditionalServiceRejectedEvent() {
    }

    public AdditionalServiceRejectedEvent(Long bookingId, Long mechanicUserId, Long requestId,
                                          String serviceName, BigDecimal amount) {
        this.bookingId = bookingId;
        this.mechanicUserId = mechanicUserId;
        this.requestId = requestId;
        this.serviceName = serviceName;
        this.amount = amount;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getMechanicUserId() {
        return mechanicUserId;
    }

    public void setMechanicUserId(Long mechanicUserId) {
        this.mechanicUserId = mechanicUserId;
    }

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
