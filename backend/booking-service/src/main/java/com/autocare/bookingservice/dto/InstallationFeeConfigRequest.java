package com.autocare.bookingservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class InstallationFeeConfigRequest {

    @NotNull(message = "Installation fee is required")
    @DecimalMin(value = "0.01", message = "Installation fee must be positive")
    private BigDecimal installationFee;

    public BigDecimal getInstallationFee() {
        return installationFee;
    }

    public void setInstallationFee(BigDecimal installationFee) {
        this.installationFee = installationFee;
    }
}
