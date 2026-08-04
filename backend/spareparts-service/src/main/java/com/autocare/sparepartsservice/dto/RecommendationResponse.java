package com.autocare.sparepartsservice.dto;

import com.autocare.sparepartsservice.entity.RecommendationStatus;
import java.time.LocalDateTime;

public class RecommendationResponse {

    private Long id;
    private Long bookingId;
    private Long mechanicId;
    private SparePartResponse sparePart;
    private int quantity;
    private String reason;
    private RecommendationStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime decidedAt;

    public RecommendationResponse() {}

    public RecommendationResponse(Long id, Long bookingId, Long mechanicId,
                                   SparePartResponse sparePart, int quantity,
                                   String reason, RecommendationStatus status,
                                   LocalDateTime createdAt, LocalDateTime decidedAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.mechanicId = mechanicId;
        this.sparePart = sparePart;
        this.quantity = quantity;
        this.reason = reason;
        this.status = status;
        this.createdAt = createdAt;
        this.decidedAt = decidedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }
    public Long getMechanicId() { return mechanicId; }
    public void setMechanicId(Long mechanicId) { this.mechanicId = mechanicId; }
    public SparePartResponse getSparePart() { return sparePart; }
    public void setSparePart(SparePartResponse sparePart) { this.sparePart = sparePart; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public RecommendationStatus getStatus() { return status; }
    public void setStatus(RecommendationStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; }
}
