package com.autocare.sparepartsservice.dto;

import com.autocare.sparepartsservice.entity.DifficultyLevel;
import com.autocare.sparepartsservice.entity.DiyStatus;

import java.time.LocalDateTime;
import java.util.List;

public class DiyGuideResponse {

    private Long id;
    private Long sparePartId;
    private String title;
    private String description;
    private DifficultyLevel difficultyLevel;
    private int estimatedTimeMinutes;
    private List<String> requiredTools;
    private List<String> safetyWarnings;
    private String videoUrl;
    private DiyStatus status;
    private List<DiyStepResponse> steps;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DiyGuideResponse() {
    }

    public DiyGuideResponse(Long id, Long sparePartId, String title, String description,
                            DifficultyLevel difficultyLevel, int estimatedTimeMinutes,
                            List<String> requiredTools, List<String> safetyWarnings,
                            String videoUrl, DiyStatus status, List<DiyStepResponse> steps,
                            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.sparePartId = sparePartId;
        this.title = title;
        this.description = description;
        this.difficultyLevel = difficultyLevel;
        this.estimatedTimeMinutes = estimatedTimeMinutes;
        this.requiredTools = requiredTools;
        this.safetyWarnings = safetyWarnings;
        this.videoUrl = videoUrl;
        this.status = status;
        this.steps = steps;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public DifficultyLevel getDifficultyLevel() {
        return difficultyLevel;
    }

    public void setDifficultyLevel(DifficultyLevel difficultyLevel) {
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

    public DiyStatus getStatus() {
        return status;
    }

    public void setStatus(DiyStatus status) {
        this.status = status;
    }

    public List<DiyStepResponse> getSteps() {
        return steps;
    }

    public void setSteps(List<DiyStepResponse> steps) {
        this.steps = steps;
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
