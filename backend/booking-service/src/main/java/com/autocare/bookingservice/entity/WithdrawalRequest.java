package com.autocare.bookingservice.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A mechanic's request to withdraw money from their wallet. The amount is
 * validated against the wallet balance at request time and re-checked when the
 * admin approves (a request is auto-rejected if the balance dropped below the
 * amount). On approval the balance is debited and a WITHDRAWAL ledger entry is
 * written. No real bank payout is attempted in this version.
 */
@Entity
@Table(name = "withdrawal_requests", indexes = {
        @Index(name = "idx_wr_mechanic", columnList = "mechanicId"),
        @Index(name = "idx_wr_status", columnList = "status")
})
public class WithdrawalRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mechanic profile id. */
    @Column(nullable = false)
    private Long mechanicId;

    /**
     * Mechanic's user account id (JWT subject) — captured when the request is
     * created so the mechanic can be notified of the admin's decision without
     * an extra lookup. Null when the profile has no linked account.
     */
    @Column
    private Long mechanicUserId;

    /** Mechanic wallet id the money would come from. */
    @Column(nullable = false)
    private Long walletId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WithdrawalStatus status = WithdrawalStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    /** When an admin approved/rejected the request. */
    @Column
    private LocalDateTime processedAt;

    /** Admin user id who processed the request. */
    @Column
    private Long processedBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.requestedAt = LocalDateTime.now();
        this.createdAt = LocalDateTime.now();
    }

    public WithdrawalRequest() {
    }

    public WithdrawalRequest(Long mechanicId, Long mechanicUserId, Long walletId,
                             BigDecimal amount) {
        this.mechanicId = mechanicId;
        this.mechanicUserId = mechanicUserId;
        this.walletId = walletId;
        this.amount = amount;
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

    public Long getMechanicUserId() {
        return mechanicUserId;
    }

    public void setMechanicUserId(Long mechanicUserId) {
        this.mechanicUserId = mechanicUserId;
    }

    public Long getWalletId() {
        return walletId;
    }

    public void setWalletId(Long walletId) {
        this.walletId = walletId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public WithdrawalStatus getStatus() {
        return status;
    }

    public void setStatus(WithdrawalStatus status) {
        this.status = status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public Long getProcessedBy() {
        return processedBy;
    }

    public void setProcessedBy(Long processedBy) {
        this.processedBy = processedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
