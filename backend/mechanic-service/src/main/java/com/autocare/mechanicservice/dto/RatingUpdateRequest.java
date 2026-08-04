package com.autocare.mechanicservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class RatingUpdateRequest {

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Double newRating;

    public Double getNewRating() {
        return newRating;
    }

    public void setNewRating(Double newRating) {
        this.newRating = newRating;
    }
}
