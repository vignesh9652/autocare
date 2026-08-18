package com.autocare.bookingservice.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class WithdrawalRequestCreate {

    @NotNull(message = "Amount is required")
    private BigDecimal amount;

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
