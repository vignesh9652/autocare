package com.autocare.mechanicservice.dto;

import com.autocare.mechanicservice.entity.AvailabilityStatus;
import jakarta.validation.constraints.NotNull;

public class AvailabilityUpdateRequest {

    @NotNull(message = "Availability status is required")
    private AvailabilityStatus availabilityStatus;

    public AvailabilityStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(AvailabilityStatus availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }
}
