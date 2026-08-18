package com.autocare.sparepartsservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class DiyStepRequest {

    @Min(value = 1, message = "Step number must be at least 1")
    private int stepNumber;

    @NotBlank(message = "Step title is required")
    private String title;

    private String description;

    private String imageUrl;

    private String videoUrl;

    public int getStepNumber() {
        return stepNumber;
    }

    public void setStepNumber(int stepNumber) {
        this.stepNumber = stepNumber;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }
}
