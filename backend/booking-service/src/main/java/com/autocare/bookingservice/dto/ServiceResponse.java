package com.autocare.bookingservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ServiceResponse {

    private Long id;
    private String serviceName;
    private String description;
    private BigDecimal basePrice;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ServiceResponse() {
    }

    public ServiceResponse(Long id, String serviceName, String description,
                           BigDecimal basePrice, boolean active,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.serviceName = serviceName;
        this.description = description;
        this.basePrice = basePrice;
        this.active = active;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getBasePrice() {
        return basePrice;
    }

    public void setBasePrice(BigDecimal basePrice) {
        this.basePrice = basePrice;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
