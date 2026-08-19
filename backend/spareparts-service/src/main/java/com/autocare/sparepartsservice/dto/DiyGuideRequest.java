package com.autocare.sparepartsservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.ArrayList;
import java.util.List;

/**
 * Payload for creating / updating a DIY guide (admin). Steps are optional at
 * creation time and can be managed through the dedicated step endpoints.
 */
public class DiyGuideRequest {

    @NotNull(message = "Spare part ID is required")
    private Long sparePartId;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private String difficultyLevel;

    @Min(value = 1, message = "Estimated time must be at least 1 minute")
    private int estimatedTimeMinutes = 30;

    private List<String> requiredTools = new ArrayList<>();

    private List<String> safetyWarnings = new ArrayList<>();

    private String videoUrl;

    private String status;

    private List<DiyStepRequest> steps = new ArrayList<>();

    public Long getSparePartId() {
        return sparePartId;
    }

    public void setSparePartId(Long sparePartId) {
        this.sparePartId = sparePartId;
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

    public String getDifficultyLevel() {
        return difficultyLevel;
    }

    public void setDifficultyLevel(String difficultyLevel) {
        this.difficultyLevel = difficultyLevel;
    }

    public int getEstimatedTimeMinutes() {
        return estimatedTimeMinutes;
    }

    public void setEstimatedTimeMinutes(int estimatedTimeMinutes) {
        this.estimatedTimeMinutes = estimatedTimeMinutes;
    }

    public List<String> getRequiredTools() {
        return requiredTools;
    }

    public void setRequiredTools(List<String> requiredTools) {
        this.requiredTools = requiredTools;
    }

    public List<String> getSafetyWarnings() {
        return safetyWarnings;
    }

    public void setSafetyWarnings(List<String> safetyWarnings) {
        this.safetyWarnings = safetyWarnings;
    }

    public String getVideoUrl() {
        return videoUrl;
    }

    public void setVideoUrl(String videoUrl) {
        this.videoUrl = videoUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<DiyStepRequest> getSteps() {
        return steps;
    }

    public void setSteps(List<DiyStepRequest> steps) {
        this.steps = steps;
    }
}
