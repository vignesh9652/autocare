package com.autocare.vehicleservice.dto;

import com.autocare.vehicleservice.entity.VehicleType;
import jakarta.validation.constraints.*;

public class VehicleRequest {

    @NotBlank(message = "Make is required")
    private String make;

    @NotBlank(message = "Model is required")
    private String model;

    @Min(value = 1886, message = "Year must be at least 1886")
    @Max(value = 2100, message = "Year must be at most 2100")
    private int year;

    @NotBlank(message = "Registration number is required")
    @Pattern(regexp = "^[A-Za-z0-9\\s\\-]+$",
             message = "Registration number must contain only letters, numbers, spaces, and hyphens")
    private String registrationNumber;

    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }
}
