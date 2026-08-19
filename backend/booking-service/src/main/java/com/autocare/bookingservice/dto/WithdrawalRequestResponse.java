package com.autocare.bookingservice.dto;

import com.autocare.bookingservice.entity.WithdrawalRequest;
import com.autocare.bookingservice.entity.WithdrawalStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class WithdrawalRequestResponse {

    private Long id;
    private Long mechanicId;
    private BigDecimal amount;
    private WithdrawalStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime processedAt;
    private Long processedBy;

    public WithdrawalRequestResponse() {
    }

    public WithdrawalRequestResponse(Long id, Long mechanicId, BigDecimal amount,
                                     WithdrawalStatus status, LocalDateTime requestedAt,
                                     LocalDateTime processedAt, Long processedBy) {
        this.id = id;
        this.mechanicId = mechanicId;
        this.amount = amount;
        this.status = status;
        this.requestedAt = requestedAt;
        this.processedAt = processedAt;
        this.processedBy = processedBy;
    }

    public static WithdrawalRequestResponse from(WithdrawalRequest request) {
        return new WithdrawalRequestResponse(
                request.getId(),
                request.getMechanicId(),
                request.getAmount(),
                request.getStatus(),
                request.getRequestedAt(),
                request.getProcessedAt(),
                request.getProcessedBy()
        );
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
}
