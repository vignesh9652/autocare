package com.autocare.bookingservice.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * An additional service recommended by the mechanic after inspecting the
 * vehicle. The customer must approve it (PENDING → APPROVED) before the
 * mechanic performs the work and before its price is added to the booking's
 * final amount. "No surprise billing" — the price always comes from the
 * platform service catalogue, never from the client.
 */
@Entity
@Table(name = "additional_service_requests", indexes = {
        @Index(name = "idx_asr_booking", columnList = "bookingId"),
        @Index(name = "idx_asr_mechanic", columnList = "mechanicId"),
        @Index(name = "idx_asr_customer", columnList = "customerId"),
        @Index(name = "idx_asr_service", columnList = "serviceId"),
        @Index(name = "idx_asr_status", columnList = "status")
})
public class AdditionalServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long bookingId;

    /** Mechanic profile id (booking.mechanicId). */
    @Column(nullable = false)
    private Long mechanicId;

    /** Mechanic's user account id (JWT subject) — used to notify the mechanic. */
    @Column(nullable = false)
    private Long mechanicUserId;

    /** Customer user account id (booking.userId). */
    @Column(nullable = false)
    private Long customerId;

    /** Platform catalogue service id. */
    @Column(nullable = false)
    private Long serviceId;

    /** Snapshot of the catalogue service name at request time. */
    @Column(nullable = false)
    private String serviceName;

    /** Mechanic's inspection note / reason for the recommendation. */
    @Column(length = 1000)
    private String reason;

    /** Official catalogue price — never supplied by the client. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AdditionalServiceStatus status = AdditionalServiceStatus.PENDING;

    /** When the customer approved/rejected the request. */
    @Column
    private LocalDateTime customerResponseAt;

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

    public AdditionalServiceRequest() {
    }

    public AdditionalServiceRequest(Long bookingId, Long mechanicId, Long mechanicUserId,
                                    Long customerId, Long serviceId, String serviceName,
                                    String reason, BigDecimal amount) {
        this.bookingId = bookingId;
        this.mechanicId = mechanicId;
        this.mechanicUserId = mechanicUserId;
        this.customerId = customerId;
        this.serviceId = serviceId;
        this.serviceName = serviceName;
        this.reason = reason;
        this.amount = amount;
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

    public Long getMechanicUserId() {
        return mechanicUserId;
    }

    public void setMechanicUserId(Long mechanicUserId) {
        this.mechanicUserId = mechanicUserId;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
