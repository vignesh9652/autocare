package com.autocare.bookingservice.dto;

import com.autocare.bookingservice.entity.BookingStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BookingResponse {

    private Long id;
    private Long userId;
    private Long vehicleId;
    private Long mechanicId;
    private String serviceType;
    private BookingStatus status;
    private LocalDateTime scheduledAt;
    private String address;
    private BigDecimal estimatedCost;
    private LocalDateTime createdAt;

    public BookingResponse() {}

    public BookingResponse(Long id, Long userId, Long vehicleId, Long mechanicId,
                           String serviceType, BookingStatus status,
                           LocalDateTime scheduledAt, String address,
                           BigDecimal estimatedCost, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.vehicleId = vehicleId;
        this.mechanicId = mechanicId;
        this.serviceType = serviceType;
        this.status = status;
        this.scheduledAt = scheduledAt;
        this.address = address;
        this.estimatedCost = estimatedCost;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
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

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(BigDecimal estimatedCost) {
        this.estimatedCost = estimatedCost;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
