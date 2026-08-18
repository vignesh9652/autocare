package com.autocare.bookingservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    /** Booking type for a spare-part installation job (Book a Mechanic). */
    public static final String SERVICE_TYPE_SPARE_PART_INSTALLATION = "SPARE_PART_INSTALLATION";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long vehicleId;

    @Column(nullable = false)
    private Long mechanicId;

    /**
     * Mechanic's user account id (JWT subject) — resolved when the booking is
     * created and used to notify the mechanic (e.g. wallet credits). Null for
     * bookings created before this field existed or when the profile has no
     * linked account.
     */
    @Column
    private Long mechanicUserId;

    @Column(nullable = false)
    private String serviceType;

    /**
     * Spare part to install — set only for SPARE_PART_INSTALLATION bookings.
     */
    @Column
    private Long sparePartId;

    /**
     * Spare-part order the part was purchased in. For SPARE_PART_INSTALLATION
     * bookings the mechanic can only start once this order is DELIVERED.
     */
    @Column
    private Long sparePartOrderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Column(nullable = false)
    private String address;

    /** GPS-fixed service location (null when typed manually). */
    @Column
    private Double latitude;

    @Column
    private Double longitude;

    /** Platform-controlled estimate shown before booking (₹). */
    @Column(precision = 10, scale = 2)
    private BigDecimal estimatedAmount;

    /** Sum of APPROVED additional-service requests (set/recomputed on decisions). */
    @Column(precision = 10, scale = 2)
    private BigDecimal additionalAmount;

    /** Final amount after inspection = estimatedAmount + approved additional. */
    @Column(precision = 10, scale = 2)
    private BigDecimal finalAmount;

    /** AutoCare cut = finalAmount × commission% / 100, set on payment success. */
    @Column(precision = 10, scale = 2)
    private BigDecimal platformCommission;

    /** Mechanic's share = finalAmount − platformCommission, set on payment success. */
    @Column(precision = 10, scale = 2)
    private BigDecimal mechanicEarning;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Booking() {}

    public Booking(Long userId, Long vehicleId, Long mechanicId,
                   String serviceType, LocalDateTime scheduledAt,
                   String address) {
        this.userId = userId;
        this.vehicleId = vehicleId;
        this.mechanicId = mechanicId;
        this.serviceType = serviceType;
        this.scheduledAt = scheduledAt;
        this.address = address;
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

    public Long getMechanicUserId() {
        return mechanicUserId;
    }

    public void setMechanicUserId(Long mechanicUserId) {
        this.mechanicUserId = mechanicUserId;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
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

    public BigDecimal getAdditionalAmount() {
        return additionalAmount;
    }

    public void setAdditionalAmount(BigDecimal additionalAmount) {
        this.additionalAmount = additionalAmount;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
