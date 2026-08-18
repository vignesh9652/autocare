package com.autocare.sparepartsservice.dto;

import com.autocare.sparepartsservice.entity.DifficultyLevel;
import com.autocare.sparepartsservice.entity.DiyStatus;

import java.time.LocalDateTime;
import java.util.List;

public class DiyStepResponse {

    private Long id;
    private Long diyGuideId;
    private int stepNumber;
    private String title;
    private String description;
    private String imageUrl;
    private String videoUrl;

    public DiyStepResponse() {
    }

    public DiyStepResponse(Long id, Long diyGuideId, int stepNumber, String title,
                           String description, String imageUrl, String videoUrl) {
        this.id = id;
        this.diyGuideId = diyGuideId;
        this.stepNumber = stepNumber;
        this.title = title;
        this.description = description;
        this.imageUrl = imageUrl;
        this.videoUrl = videoUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getDiyGuideId() {
        return diyGuideId;
    }

    public void setDiyGuideId(Long diyGuideId) {
        this.diyGuideId = diyGuideId;
    }

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
