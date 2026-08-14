package com.autocare.mechanicservice.dto;

import com.autocare.mechanicservice.entity.AvailabilityStatus;

import java.util.List;

public class MechanicResponse {

    private Long id;
    private Long userId;
    private String name;
    private String phone;
    private String email;
    private List<String> skills;
    private String serviceArea;
    private Double latitude;
    private Double longitude;
    private AvailabilityStatus availabilityStatus;
    private Double averageRating;
    private Integer totalJobsCompleted;

    public MechanicResponse() {}

    public MechanicResponse(Long id, String name, String phone, String email,
                            List<String> skills, String serviceArea,
                            Double latitude, Double longitude,
                            AvailabilityStatus availabilityStatus,
                            Double averageRating, Integer totalJobsCompleted) {
        this(id, null, name, phone, email, skills, serviceArea,
                latitude, longitude, availabilityStatus, averageRating, totalJobsCompleted);
    }

    public MechanicResponse(Long id, Long userId, String name, String phone, String email,
                            List<String> skills, String serviceArea,
                            Double latitude, Double longitude,
                            AvailabilityStatus availabilityStatus,
                            Double averageRating, Integer totalJobsCompleted) {
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.skills = skills;
        this.serviceArea = serviceArea;
        this.latitude = latitude;
        this.longitude = longitude;
        this.availabilityStatus = availabilityStatus;
        this.averageRating = averageRating;
        this.totalJobsCompleted = totalJobsCompleted;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setSkills(List<String> skills) {
        this.skills = skills;
    }

    public String getServiceArea() {
        return serviceArea;
    }

    public void setServiceArea(String serviceArea) {
        this.serviceArea = serviceArea;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public AvailabilityStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(AvailabilityStatus availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getTotalJobsCompleted() {
        return totalJobsCompleted;
    }

    public void setTotalJobsCompleted(Integer totalJobsCompleted) {
        this.totalJobsCompleted = totalJobsCompleted;
    }
}
