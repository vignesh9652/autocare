package com.autocare.bookingservice.dto;

import java.math.BigDecimal;

public class InstallationFeeConfigResponse {

    private BigDecimal installationFee;

    public InstallationFeeConfigResponse() {
    }

    public InstallationFeeConfigResponse(BigDecimal installationFee) {
        this.installationFee = installationFee;
    }

    public BigDecimal getInstallationFee() {
        return installationFee;
    }

    public void setInstallationFee(BigDecimal installationFee) {
        this.installationFee = installationFee;
    }
}
