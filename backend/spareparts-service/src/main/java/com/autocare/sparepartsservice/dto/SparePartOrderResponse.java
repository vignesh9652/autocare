package com.autocare.sparepartsservice.dto;

import com.autocare.sparepartsservice.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class SparePartOrderResponse {

    private Long id;
    private Long userId;
    private List<SparePartOrderItemResponse> items;
    private OrderStatus status;
    private String paymentStatus;
    private BigDecimal deliveryFee;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String address;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public SparePartOrderResponse() {
    }

    public SparePartOrderResponse(Long id, Long userId, List<SparePartOrderItemResponse> items,
                                  OrderStatus status, String paymentStatus,
                                  BigDecimal deliveryFee, BigDecimal discountAmount,
                                  BigDecimal totalAmount, String address,
                                  LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.items = items;
        this.status = status;
        this.paymentStatus = paymentStatus;
        this.deliveryFee = deliveryFee;
        this.discountAmount = discountAmount;
        this.totalAmount = totalAmount;
        this.address = address;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public List<SparePartOrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<SparePartOrderItemResponse> items) {
        this.items = items;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
