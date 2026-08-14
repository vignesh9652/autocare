package com.autocare.bookingservice.dto;

import com.autocare.bookingservice.entity.AdditionalServiceStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdditionalServiceResponse {

    private Long id;
    private Long bookingId;
    private Long mechanicId;
    private Long customerId;
    private Long serviceId;
    private String serviceName;
    private String reason;
    private BigDecimal amount;
    private AdditionalServiceStatus status;
    private LocalDateTime customerResponseAt;
    private LocalDateTime createdAt;

    public AdditionalServiceResponse() {
    }

    public AdditionalServiceResponse(Long id, Long bookingId, Long mechanicId, Long customerId,
                                     Long serviceId, String serviceName, String reason,
                                     BigDecimal amount, AdditionalServiceStatus status,
                                     LocalDateTime customerResponseAt, LocalDateTime createdAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.mechanicId = mechanicId;
        this.customerId = customerId;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.reason = reason;
        this.amount = amount;
        this.status = status;
        this.customerResponseAt = customerResponseAt;
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

    public Long getMechanicId() {
        return mechanicId;
    }

    public void setMechanicId(Long mechanicId) {
        this.mechanicId = mechanicId;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
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

    public AdditionalServiceStatus getStatus() {
        return status;
    }

    public void setStatus(AdditionalServiceStatus status) {
        this.status = status;
    }

    public LocalDateTime getCustomerResponseAt() {
        return customerResponseAt;
    }

    public void setCustomerResponseAt(LocalDateTime customerResponseAt) {
        this.customerResponseAt = customerResponseAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
