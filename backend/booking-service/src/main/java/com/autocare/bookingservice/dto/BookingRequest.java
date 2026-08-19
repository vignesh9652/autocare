package com.autocare.bookingservice.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BookingRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotBlank(message = "Service type is required")
    private String serviceType;

    @NotNull(message = "Scheduled date/time is required")
    private LocalDateTime scheduledAt;

    @NotBlank(message = "Address is required")
    private String address;

    /**
     * Exact service location captured from the customer's device GPS.
     * Optional — customers may also type an address manually.
     */
    @DecimalMin(value = "-90", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @DecimalMin(value = "-180", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180", message = "Longitude must be between -180 and 180")
    private Double longitude;

    /**
     * Ignored by the backend: the estimate is always recalculated from the
     * platform catalogue, and unknown services are rejected. Kept for API
     * compatibility so older clients keep deserializing.
     */
    private BigDecimal estimatedAmount;

    /**
     * Optional mechanic chosen by the customer. When present, the booking is
     * sent directly to this mechanic; when absent, the system auto-assigns the
     * first available mechanic matching the preferred skill / service area.
     */
    private Long mechanicId;

    private String preferredSkill;

    private String serviceArea;

    public BookingRequest() {}

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public BigDecimal getEstimatedAmount() {
        return estimatedAmount;
    }

    public void setEstimatedAmount(BigDecimal estimatedAmount) {
        this.estimatedAmount = estimatedAmount;
    }

    public Long getMechanicId() {
        return mechanicId;
    }

    public void setMechanicId(Long mechanicId) {
        this.mechanicId = mechanicId;
    }

    public String getPreferredSkill() {
        return preferredSkill;
    }

    public void setPreferredSkill(String preferredSkill) {
        this.preferredSkill = preferredSkill;
    }

    public String getServiceArea() {
        return serviceArea;
    }

    public void setServiceArea(String serviceArea) {
        this.serviceArea = serviceArea;
    }
}
