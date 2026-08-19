package com.autocare.paymentservice.dto;

import jakarta.validation.constraints.NotBlank;

public class WebhookPayload {

    @NotBlank(message = "Gateway transaction id is required")
    private String gatewayTransactionId;

    @NotBlank(message = "Status is required (SUCCESS or FAILED)")
    private String status;

    @NotBlank(message = "Signature is required")
    private String signature;

    public WebhookPayload() {}

    public String getGatewayTransactionId() {
        return gatewayTransactionId;
    }

    public void setGatewayTransactionId(String gatewayTransactionId) {
        this.gatewayTransactionId = gatewayTransactionId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSignature() {
        return signature;
    }

    public void setSignature(String signature) {
        this.signature = signature;
    }
}
