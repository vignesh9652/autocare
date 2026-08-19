package com.autocare.bookingservice.dto;

import java.math.BigDecimal;

public class MechanicWalletResponse {

    private Long mechanicId;
    private BigDecimal balance;
    private BigDecimal totalEarnings;
    private BigDecimal totalWithdrawn;

    public MechanicWalletResponse() {
    }

    public MechanicWalletResponse(Long mechanicId, BigDecimal balance,
                                  BigDecimal totalEarnings, BigDecimal totalWithdrawn) {
        this.mechanicId = mechanicId;
        this.balance = balance;
        this.totalEarnings = totalEarnings;
        this.totalWithdrawn = totalWithdrawn;
    }

    public Long getMechanicId() {
        return mechanicId;
    }

    public void setMechanicId(Long mechanicId) {
        this.mechanicId = mechanicId;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public BigDecimal getTotalEarnings() {
        return totalEarnings;
    }

    public void setTotalEarnings(BigDecimal totalEarnings) {
        this.totalEarnings = totalEarnings;
    }

    public BigDecimal getTotalWithdrawn() {
        return totalWithdrawn;
    }

    public void setTotalWithdrawn(BigDecimal totalWithdrawn) {
        this.totalWithdrawn = totalWithdrawn;
    }
}
