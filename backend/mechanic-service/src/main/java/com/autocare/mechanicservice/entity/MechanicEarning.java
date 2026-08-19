package com.autocare.mechanicservice.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A mechanic's earning for one paid job, created when the customer pays the
 * booking through the AutoCare platform (driven by the {@code booking.paid}
 * event from booking-service).
 *
 * <p>The unique {@code bookingId} is the idempotency guard: a duplicated
 * event cannot create a second earning for the same booking.</p>
 */
@Entity
@Table(name = "mechanic_earnings")
public class MechanicEarning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long mechanicId;

    @Column(nullable = false, unique = true)
    private Long bookingId;

    @Column(nullable = false)
    private Long paymentId;

    /** Gross amount the customer paid for the service. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal serviceAmount;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal platformCommission;

    /** serviceAmount − platformCommission. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal mechanicEarning;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EarningStatus earningStatus = EarningStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public MechanicEarning() {
    }

    public MechanicEarning(Long mechanicId, Long bookingId, Long paymentId,
                           BigDecimal serviceAmount, BigDecimal platformCommission,
                           BigDecimal mechanicEarning) {
        this.mechanicId = mechanicId;
        this.bookingId = bookingId;
        this.paymentId = paymentId;
        this.serviceAmount = serviceAmount;
        this.platformCommission = platformCommission;
        this.mechanicEarning = mechanicEarning;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMechanicId() {
        return mechanicId;
    }

    public void setMechanicId(Long mechanicId) {
        this.mechanicId = mechanicId;
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
