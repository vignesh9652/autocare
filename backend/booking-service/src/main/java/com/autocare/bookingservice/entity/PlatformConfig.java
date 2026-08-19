package com.autocare.bookingservice.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Simple key-value platform configuration (e.g. the AutoCare commission
 * percentage). Kept intentionally tiny for the MVP — a full admin
 * configuration table can replace this later without API changes.
 */
@Entity
@Table(name = "platform_config")
public class PlatformConfig {

    public static final String KEY_COMMISSION_PERCENTAGE = "platform.commission.percentage";

    /** Flat fee AutoCare charges for a spare-part installation booking (₹). */
    public static final String KEY_INSTALLATION_FEE = "platform.installation.fee";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String configKey;

    @Column(nullable = false)
    private String configValue;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PreUpdate
    @PrePersist
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }

    public PlatformConfig() {
    }

    public PlatformConfig(String configKey, String configValue) {
        this.configKey = configKey;
        this.configValue = configValue;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getConfigKey() {
        return configKey;
    }

    public void setConfigKey(String configKey) {
        this.configKey = configKey;
    }

    public String getConfigValue() {
        return configValue;
    }

    public void setConfigValue(String configValue) {
        this.configValue = configValue;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
