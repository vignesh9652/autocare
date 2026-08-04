package com.autocare.sparepartsservice.dto;

import com.autocare.sparepartsservice.entity.RecommendationStatus;
import jakarta.validation.constraints.NotNull;

public class RecommendationDecisionRequest {

    @NotNull(message = "Status is required")
    private RecommendationStatus status;

    public RecommendationStatus getStatus() {
        return status;
    }

    public void setStatus(RecommendationStatus status) {
        this.status = status;
    }
}
