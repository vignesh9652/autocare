package com.autocare.paymentservice.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request body for {@code POST /api/payments/create-spare-part-order}.
 *
 * <p>Only the order id is trusted — the amount is always resolved
 * server-side from the spare-part order's totalAmount, never from the client.</p>
 */
public class CreateSparePartOrderRequest {

    @NotNull(message = "Order id is required")
    private Long orderId;

    /**
     * When true, the platform-configured installation fee is added to the
     * Razorpay order amount so the customer pays for part + delivery +
     * installation in a single transaction.
     */
    private Boolean includeInstallationFee;

    public CreateSparePartOrderRequest() {
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public Boolean getIncludeInstallationFee() {
        return includeInstallationFee;
    }

    public void setIncludeInstallationFee(Boolean includeInstallationFee) {
        this.includeInstallationFee = includeInstallationFee;
    }
}
