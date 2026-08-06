package com.autocare.userservice.dto;

import com.autocare.userservice.entity.AccountStatus;
import com.autocare.userservice.entity.Role;

import java.time.LocalDateTime;

/**
 * Admin-facing user summary. Deliberately excludes the password hash.
 */
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private AccountStatus status;
    private LocalDateTime createdAt;

    public UserResponse() {}

    public UserResponse(Long id, String name, String email, String phone,
                        Role role, AccountStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.status = status;
        this.createdAt = createdAt;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public AccountStatus getStatus() {
        return status;
    }

    public void setStatus(AccountStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
