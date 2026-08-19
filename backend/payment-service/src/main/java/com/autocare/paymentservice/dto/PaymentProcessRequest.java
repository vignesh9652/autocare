package com.autocare.paymentservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Request body for the development simulation endpoint
 * {@code POST /api/payments/{id}/process}. In production this step happens
 * inside the payment gateway; here the customer-facing flow triggers it.
 */
public class PaymentProcessRequest {

    @NotBlank(message = "Status is required (SUCCESS or FAILED)")
    @Pattern(regexp = "SUCCESS|FAILED", message = "Status must be SUCCESS or FAILED")
    private String status;

    public PaymentProcessRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
