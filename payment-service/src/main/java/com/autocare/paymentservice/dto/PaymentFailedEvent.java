package com.autocare.paymentservice.dto;

import com.autocare.paymentservice.entity.ReferenceType;

import java.math.BigDecimal;

public class PaymentFailedEvent {

    private Long transactionId;
    private ReferenceType referenceType;
    private Long referenceId;
    private BigDecimal amount;

    public PaymentFailedEvent() {}

    public PaymentFailedEvent(Long transactionId, ReferenceType referenceType,
                              Long referenceId, BigDecimal amount) {
        this.transactionId = transactionId;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.amount = amount;
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public ReferenceType getReferenceType() {
        return referenceType;
    }

    public void setReferenceType(ReferenceType referenceType) {
        this.referenceType = referenceType;
    }

    public Long getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Long referenceId) {
        this.referenceId = referenceId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
