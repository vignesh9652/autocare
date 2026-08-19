package com.autocare.bookingservice.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class CommissionConfigRequest {

    @NotNull(message = "Commission percentage is required")
    @DecimalMin(value = "0.0", message = "Commission cannot be negative")
    @DecimalMax(value = "100.0", message = "Commission cannot exceed 100%")
    private BigDecimal platformCommissionPercentage;

    public CommissionConfigRequest() {
    }

    public BigDecimal getPlatformCommissionPercentage() {
        return platformCommissionPercentage;
    }

    public void setPlatformCommissionPercentage(BigDecimal platformCommissionPercentage) {
        this.platformCommissionPercentage = platformCommissionPercentage;
    }
}
