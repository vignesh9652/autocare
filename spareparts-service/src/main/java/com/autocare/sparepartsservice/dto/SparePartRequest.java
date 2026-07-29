package com.autocare.sparepartsservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;

public class SparePartRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    private List<String> compatibleVehicleModels;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @Min(value = 0, message = "Stock quantity cannot be negative")
    private int stockQuantity;

    @NotBlank(message = "Category is required")
    private String category;

    private String tutorialVideoUrl;

    private String installationSteps;

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
}
