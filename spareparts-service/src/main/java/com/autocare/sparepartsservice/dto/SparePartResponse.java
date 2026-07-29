package com.autocare.sparepartsservice.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class SparePartResponse {

    private Long id;
    private String name;
    private String description;
    private List<String> compatibleVehicleModels;
    private BigDecimal price;
    private int stockQuantity;
    private String category;
    private String tutorialVideoUrl;
    private String installationSteps;
    private LocalDateTime createdAt;

    public SparePartResponse() {}

    public SparePartResponse(Long id, String name, String description,
                             List<String> compatibleVehicleModels, BigDecimal price,
                             int stockQuantity, String category,
                             String tutorialVideoUrl, String installationSteps,
                             LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.compatibleVehicleModels = compatibleVehicleModels;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.category = category;
        this.tutorialVideoUrl = tutorialVideoUrl;
        this.installationSteps = installationSteps;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<String> getCompatibleVehicleModels() {
        return compatibleVehicleModels;
    }

    public void setCompatibleVehicleModels(List<String> compatibleVehicleModels) {
        this.compatibleVehicleModels = compatibleVehicleModels;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public void setStockQuantity(int stockQuantity) {
        this.stockQuantity = stockQuantity;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTutorialVideoUrl() {
        return tutorialVideoUrl;
    }

    public void setTutorialVideoUrl(String tutorialVideoUrl) {
        this.tutorialVideoUrl = tutorialVideoUrl;
    }

    public String getInstallationSteps() {
        return installationSteps;
    }

    public void setInstallationSteps(String installationSteps) {
        this.installationSteps = installationSteps;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
