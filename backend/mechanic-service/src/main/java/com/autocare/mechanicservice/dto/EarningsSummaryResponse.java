package com.autocare.mechanicservice.dto;

import java.math.BigDecimal;
import java.util.List;

public class EarningsSummaryResponse {

    /** Sum of all earnings across every paid job. */
    private BigDecimal totalEarnings;

    /** Earnings recorded but not yet disbursed (available balance). */
    private BigDecimal pendingEarnings;

    /** Earnings already settled/disbursed. */
    private BigDecimal completedEarnings;

    /** Money the mechanic can withdraw today (= pendingEarnings). */
    private BigDecimal availableBalance;

    private List<MechanicEarningResponse> earnings;

    public EarningsSummaryResponse() {
    }

    public EarningsSummaryResponse(BigDecimal totalEarnings, BigDecimal pendingEarnings,
                                   BigDecimal completedEarnings, BigDecimal availableBalance,
                                   List<MechanicEarningResponse> earnings) {
        this.totalEarnings = totalEarnings;
        this.pendingEarnings = pendingEarnings;
        this.completedEarnings = completedEarnings;
        this.availableBalance = availableBalance;
        this.earnings = earnings;
    }

    public BigDecimal getTotalEarnings() {
        return totalEarnings;
    }

    public void setTotalEarnings(BigDecimal totalEarnings) {
        this.totalEarnings = totalEarnings;
    }

    public BigDecimal getPendingEarnings() {
        return pendingEarnings;
    }

    public void setPendingEarnings(BigDecimal pendingEarnings) {
        this.pendingEarnings = pendingEarnings;
    }

    public BigDecimal getCompletedEarnings() {
        return completedEarnings;
    }

    public void setCompletedEarnings(BigDecimal completedEarnings) {
        this.completedEarnings = completedEarnings;
    }

    public BigDecimal getAvailableBalance() {
        return availableBalance;
    }

    public void setAvailableBalance(BigDecimal availableBalance) {
        this.availableBalance = availableBalance;
    }

    public List<MechanicEarningResponse> getEarnings() {
        return earnings;
    }

    public void setEarnings(List<MechanicEarningResponse> earnings) {
        this.earnings = earnings;
    }
}
