package com.autocare.sparepartsservice.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * A line item on a {@link SparePartOrder}. Prices are snapshotted from the
 * spare part at order time so later price edits never change an order.
 */
@Entity
@Table(name = "spare_part_order_items")
public class SparePartOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Long sparePartId;

    @Column(nullable = false)
    private String partName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int quantity;

    public SparePartOrderItem() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
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
