package com.autocare.bookingservice.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Payload for booking a mechanic to install a spare part
 * ({@code POST /api/bookings/installation}).
 *
 * <p>The installation fee is always resolved server-side from the platform
 * configuration — the client can never set its own price. The spare part must
 * exist; when a {@code sparePartOrderId} is supplied, the order must belong to
 * the customer and be paid before the booking is created.</p>
 */
public class InstallationBookingRequest {

    @NotNull(message = "Vehicle ID is required")
    private Long vehicleId;

    @NotNull(message = "Spare part ID is required")
    private Long sparePartId;

    /** Optional — links this installation to a purchased spare-part order. */
    private Long sparePartOrderId;

    @NotNull(message = "Scheduled date/time is required")
    private LocalDateTime scheduledAt;

    @NotBlank(message = "Address is required")
    private String address;

    @DecimalMin(value = "-90", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @DecimalMin(value = "-180", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180", message = "Longitude must be between -180 and 180")
    private Double longitude;

    /** Optional mechanic chosen by the customer (auto-assign when absent). */
    private Long mechanicId;

    private String preferredSkill;

    private String serviceArea;

    /** Ignored by the backend — the fee always comes from platform config. */
    private BigDecimal installationFee;

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public Long getSparePartId() {
        return sparePartId;
    }

    public void setSparePartId(Long sparePartId) {
        this.sparePartId = sparePartId;
    }

    public Long getSparePartOrderId() {
        return sparePartOrderId;
    }

    public void setSparePartOrderId(Long sparePartOrderId) {
        this.sparePartOrderId = sparePartOrderId;
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

    public BigDecimal getInstallationFee() {
        return installationFee;
    }

    public void setInstallationFee(BigDecimal installationFee) {
        this.installationFee = installationFee;
    }
}
