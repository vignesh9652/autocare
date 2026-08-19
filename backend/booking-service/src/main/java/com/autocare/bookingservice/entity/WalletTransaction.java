package com.autocare.bookingservice.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Immutable ledger entry — every wallet balance change must create one.
 *
 * <p>The unique constraint on {@code (walletType, bookingId, paymentId,
 * transactionType)} is the DB-level duplicate-payment / duplicate-refund
 * guard: a booking's payment can credit each wallet exactly once, and a
 * refund can reverse it exactly once. Withdrawal rows have null bookingId /
 * paymentId so they are not constrained.</p>
 */
@Entity
@Table(name = "wallet_transactions", indexes = {
        @Index(name = "idx_wtx_wallet", columnList = "walletType,walletId"),
        @Index(name = "idx_wtx_mechanic", columnList = "mechanicId"),
        @Index(name = "idx_wtx_booking", columnList = "bookingId"),
        @Index(name = "idx_wtx_created", columnList = "createdAt")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_wtx_source",
                columnNames = {"walletType", "bookingId", "paymentId", "transactionType"})
})
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WalletType walletType;

    /** Wallet id this entry belongs to (admin_wallets.id / mechanic_wallets.id). */
    @Column(nullable = false)
    private Long walletId;

    /** Mechanic profile id — only for MECHANIC wallet entries. */
    @Column
    private Long mechanicId;

    /** Source booking (null for withdrawals). */
    @Column
    private Long bookingId;

    /** Source payment transaction (null for withdrawals). */
    @Column
    private Long paymentId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private WalletTransactionType transactionType;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    /** Wallet balance immediately after this entry was applied. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal balanceAfterTransaction;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public WalletTransaction() {
    }

    public WalletTransaction(WalletType walletType, Long walletId, Long mechanicId,
                             Long bookingId, Long paymentId,
                             WalletTransactionType transactionType, BigDecimal amount,
                             BigDecimal balanceAfterTransaction, String description) {
        this.walletType = walletType;
        this.walletId = walletId;
        this.mechanicId = mechanicId;
        this.bookingId = bookingId;
        this.paymentId = paymentId;
        this.transactionType = transactionType;
        this.amount = amount;
        this.balanceAfterTransaction = balanceAfterTransaction;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public WalletType getWalletType() {
        return walletType;
    }

    public void setWalletType(WalletType walletType) {
        this.walletType = walletType;
    }

    public Long getWalletId() {
        return walletId;
    }

    public void setWalletId(Long walletId) {
        this.walletId = walletId;
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

    public WalletTransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(WalletTransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getBalanceAfterTransaction() {
        return balanceAfterTransaction;
    }

    public void setBalanceAfterTransaction(BigDecimal balanceAfterTransaction) {
        this.balanceAfterTransaction = balanceAfterTransaction;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
