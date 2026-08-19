package com.autocare.sparepartsservice.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A step-by-step do-it-yourself installation guide for a spare part.
 * One published guide per spare part; customer-facing endpoints only expose
 * guides whose status is {@link DiyStatus#PUBLISHED}.
 */
@Entity
@Table(name = "diy_guides")
public class DIYGuide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sparePartId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DifficultyLevel difficultyLevel = DifficultyLevel.MEDIUM;

    @Column(nullable = false)
    private int estimatedTimeMinutes;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "diy_guide_required_tools",
            joinColumns = @JoinColumn(name = "diy_guide_id")
    )
    @Column(name = "tool_name")
    private List<String> requiredTools = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "diy_guide_safety_warnings",
            joinColumns = @JoinColumn(name = "diy_guide_id")
    )
    @Column(name = "warning_text")
    private List<String> safetyWarnings = new ArrayList<>();

    private String videoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DiyStatus status = DiyStatus.DRAFT;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public DIYGuide() {
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
