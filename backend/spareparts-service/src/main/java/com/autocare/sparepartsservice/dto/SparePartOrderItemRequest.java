package com.autocare.sparepartsservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SparePartOrderItemRequest {

    @NotNull(message = "Spare part ID is required")
    private Long sparePartId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity = 1;

    public Long getSparePartId() {
        return sparePartId;
    }

    public void setSparePartId(Long sparePartId) {
        this.sparePartId = sparePartId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
