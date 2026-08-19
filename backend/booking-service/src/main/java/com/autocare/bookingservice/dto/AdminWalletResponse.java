package com.autocare.bookingservice.dto;

import java.math.BigDecimal;

public class AdminWalletResponse {

    private BigDecimal balance;
    private BigDecimal totalCommission;
    private BigDecimal totalWithdrawn;

    public AdminWalletResponse() {
    }

    public AdminWalletResponse(BigDecimal balance, BigDecimal totalCommission,
                               BigDecimal totalWithdrawn) {
        this.balance = balance;
        this.totalCommission = totalCommission;
        this.totalWithdrawn = totalWithdrawn;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public BigDecimal getTotalCommission() {
        return totalCommission;
    }

    public void setTotalCommission(BigDecimal totalCommission) {
        this.totalCommission = totalCommission;
    }

    public BigDecimal getTotalWithdrawn() {
        return totalWithdrawn;
    }

    public void setTotalWithdrawn(BigDecimal totalWithdrawn) {
        this.totalWithdrawn = totalWithdrawn;
    }
}
