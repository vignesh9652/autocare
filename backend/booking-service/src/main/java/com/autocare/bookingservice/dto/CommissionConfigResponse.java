package com.autocare.bookingservice.dto;

import java.math.BigDecimal;

public class CommissionConfigResponse {

    private BigDecimal platformCommissionPercentage;

    public CommissionConfigResponse() {
    }

    public CommissionConfigResponse(BigDecimal platformCommissionPercentage) {
        this.platformCommissionPercentage = platformCommissionPercentage;
    }

    public BigDecimal getPlatformCommissionPercentage() {
        return platformCommissionPercentage;
    }

    public void setPlatformCommissionPercentage(BigDecimal platformCommissionPercentage) {
        this.platformCommissionPercentage = platformCommissionPercentage;
    }
}
