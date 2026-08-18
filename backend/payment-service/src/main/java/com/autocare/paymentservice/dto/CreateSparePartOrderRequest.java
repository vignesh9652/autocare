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

    public CreateSparePartOrderRequest() {
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
}
