package com.autocare.bookingservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Published on the {@code withdrawal.processed} routing key when an admin
 * approves or rejects a mechanic's withdrawal request. notification-service
 * uses it to tell the mechanic the outcome.
 */
public class WithdrawalRequestProcessedEvent {

    private Long withdrawalId;
    private Long mechanicId;
    /** Mechanic's user account id — the notification target (may be null). */
    private Long mechanicUserId;
    private BigDecimal amount;
    /** APPROVED or REJECTED. */
    private String status;
    /** Mechanic wallet balance after processing (unchanged when rejected). */
    private BigDecimal balance;
    private LocalDateTime processedAt;

    public WithdrawalRequestProcessedEvent() {
    }

    public WithdrawalRequestProcessedEvent(Long withdrawalId, Long mechanicId,
                                           Long mechanicUserId, BigDecimal amount,
                                           String status, BigDecimal balance,
                                           LocalDateTime processedAt) {
        this.withdrawalId = withdrawalId;
        this.mechanicId = mechanicId;
        this.mechanicUserId = mechanicUserId;
        this.amount = amount;
        this.status = status;
        this.balance = balance;
        this.processedAt = processedAt;
    }

    public Long getWithdrawalId() {
        return withdrawalId;
    }

    public void setWithdrawalId(Long withdrawalId) {
        this.withdrawalId = withdrawalId;
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

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }
}
