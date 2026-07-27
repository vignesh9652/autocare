package com.autocare.vehicleservice.dto;

import com.autocare.vehicleservice.entity.VehicleType;
import java.time.LocalDateTime;

public class VehicleResponse {

    private Long id;
    private String make;
    private String model;
    private int year;
    private String registrationNumber;
    private VehicleType vehicleType;
    private LocalDateTime createdAt;

    public VehicleResponse() {}

    public VehicleResponse(Long id, String make, String model, int year,
                           String registrationNumber, VehicleType vehicleType,
                           LocalDateTime createdAt) {
        this.id = id;
        this.make = make;
        this.model = model;
        this.year = year;
        this.registrationNumber = registrationNumber;
        this.vehicleType = vehicleType;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
