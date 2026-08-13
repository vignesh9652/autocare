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
    private Double latitude;
    private Double longitude;
    private BigDecimal estimatedAmount;
    private BigDecimal finalAmount;
    private BigDecimal platformCommission;
    private BigDecimal mechanicEarning;
    private LocalDateTime createdAt;

    public BookingResponse() {
    }

    public BookingResponse(Long id, Long userId, Long vehicleId, Long mechanicId,
                           String serviceType, BookingStatus status,
                           LocalDateTime scheduledAt, String address,
                           BigDecimal estimatedAmount, LocalDateTime createdAt) {
        this(id, userId, vehicleId, mechanicId, serviceType, status,
                scheduledAt, address, null, null, estimatedAmount,
                null, null, null, createdAt);
    }

    public BookingResponse(Long id, Long userId, Long vehicleId, Long mechanicId,
                           String serviceType, BookingStatus status,
                           LocalDateTime scheduledAt, String address,
                           Double latitude, Double longitude,
                           BigDecimal estimatedAmount, LocalDateTime createdAt) {
        this(id, userId, vehicleId, mechanicId, serviceType, status,
                scheduledAt, address, latitude, longitude, estimatedAmount,
                null, null, null, createdAt);
    }

    public BookingResponse(Long id, Long userId, Long vehicleId, Long mechanicId,
                           String serviceType, BookingStatus status,
                           LocalDateTime scheduledAt, String address,
                           Double latitude, Double longitude,
                           BigDecimal estimatedAmount,
                           BigDecimal finalAmount,
                           BigDecimal platformCommission,
                           BigDecimal mechanicEarning,
                           LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.vehicleId = vehicleId;
        this.mechanicId = mechanicId;
        this.serviceType = serviceType;
        this.status = status;
        this.scheduledAt = scheduledAt;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.estimatedAmount = estimatedAmount;
        this.finalAmount = finalAmount;
        this.platformCommission = platformCommission;
        this.mechanicEarning = mechanicEarning;
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

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(BigDecimal finalAmount) {
        this.finalAmount = finalAmount;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
