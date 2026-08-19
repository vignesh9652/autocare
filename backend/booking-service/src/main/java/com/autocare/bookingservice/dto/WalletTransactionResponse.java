package com.autocare.bookingservice.dto;

import com.autocare.bookingservice.entity.WalletTransaction;
import com.autocare.bookingservice.entity.WalletTransactionType;
import com.autocare.bookingservice.entity.WalletType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class WalletTransactionResponse {

    private Long id;
    private WalletType walletType;
    private Long bookingId;
    private Long paymentId;
    private WalletTransactionType transactionType;
    private BigDecimal amount;
    private BigDecimal balanceAfterTransaction;
    private String description;
    private LocalDateTime createdAt;

    public WalletTransactionResponse() {
    }

    public WalletTransactionResponse(Long id, WalletType walletType, Long bookingId,
                                     Long paymentId, WalletTransactionType transactionType,
                                     BigDecimal amount, BigDecimal balanceAfterTransaction,
                                     String description, LocalDateTime createdAt) {
        this.id = id;
        this.walletType = walletType;
        this.bookingId = bookingId;
        this.paymentId = paymentId;
        this.transactionType = transactionType;
        this.amount = amount;
        this.balanceAfterTransaction = balanceAfterTransaction;
        this.description = description;
        this.createdAt = createdAt;
    }

    public static WalletTransactionResponse from(WalletTransaction txn) {
        return new WalletTransactionResponse(
                txn.getId(),
                txn.getWalletType(),
                txn.getBookingId(),
                txn.getPaymentId(),
                txn.getTransactionType(),
                txn.getAmount(),
                txn.getBalanceAfterTransaction(),
                txn.getDescription(),
                txn.getCreatedAt()
        );
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
