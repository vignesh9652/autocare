package com.autocare.sparepartsservice.dto;

import java.math.BigDecimal;

public class SparePartOrderItemResponse {

    private Long id;
    private Long sparePartId;
    private String partName;
    private BigDecimal unitPrice;
    private int quantity;

    public SparePartOrderItemResponse() {
    }

    public SparePartOrderItemResponse(Long id, Long sparePartId, String partName,
                                      BigDecimal unitPrice, int quantity) {
        this.id = id;
        this.sparePartId = sparePartId;
        this.partName = partName;
        this.unitPrice = unitPrice;
        this.quantity = quantity;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSparePartId() {
        return sparePartId;
    }

    public void setSparePartId(Long sparePartId) {
        this.sparePartId = sparePartId;
    }

    public String getPartName() {
        return partName;
    }

    public void setPartName(String partName) {
        this.partName = partName;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
