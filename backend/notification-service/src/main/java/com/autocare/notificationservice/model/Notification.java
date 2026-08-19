package com.autocare.notificationservice.model;

import java.time.LocalDateTime;

/**
 * A single notification record delivered to a user.
 * Stored in-memory (this service has no database by design).
 */
public class Notification {

    private Long id;
    private Long userId;
    private String type;      // e.g. BOOKING_CREATED, BOOKING_COMPLETED, PAYMENT_SUCCESS, PAYMENT_FAILED
    private String title;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;

    public Notification(Long id, Long userId, String type, String title, String message) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.read = false;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
