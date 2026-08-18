package com.autocare.sparepartsservice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;

public class SparePartOrderRequest {

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<SparePartOrderItemRequest> items;

    @NotBlank(message = "Delivery address is required")
    private String address;

    /**
     * Optional coupon/discount. Validated server-side: never negative and
     * never larger than the item subtotal.
     */
    private BigDecimal discountAmount;

    public List<SparePartOrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<SparePartOrderItemRequest> items) {
        this.items = items;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }
}
