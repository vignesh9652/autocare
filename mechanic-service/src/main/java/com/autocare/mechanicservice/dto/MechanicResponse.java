package com.autocare.mechanicservice.dto;

import com.autocare.mechanicservice.entity.AvailabilityStatus;

import java.util.List;

public class MechanicResponse {

    private Long id;
    private String name;
    private String phone;
    private String email;
    private List<String> skills;
    private String serviceArea;
    private AvailabilityStatus availabilityStatus;
    private Double averageRating;
    private Integer totalJobsCompleted;

    public MechanicResponse() {}

    public MechanicResponse(Long id, String name, String phone, String email,
                            List<String> skills, String serviceArea,
                            AvailabilityStatus availabilityStatus,
                            Double averageRating, Integer totalJobsCompleted) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.skills = skills;
        this.serviceArea = serviceArea;
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
