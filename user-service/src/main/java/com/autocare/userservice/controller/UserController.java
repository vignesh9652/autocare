package com.autocare.userservice.controller;

import com.autocare.userservice.dto.UserResponse;
import com.autocare.userservice.entity.User;
import com.autocare.userservice.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * User management endpoints.
 *
 * <p>These are admin-only — SecurityConfig requires the ADMIN role on
 * /api/users/admin/**. Consumed by the admin-service aggregation layer
 * (UserServiceClient).</p>
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Lists all users. Returns safe summaries only (no password hashes).
     */
    @GetMapping("/admin/all")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
