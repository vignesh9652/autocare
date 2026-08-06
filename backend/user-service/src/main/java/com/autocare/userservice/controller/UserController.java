package com.autocare.userservice.controller;

import com.autocare.userservice.dto.UserResponse;
import com.autocare.userservice.entity.AccountStatus;
import com.autocare.userservice.entity.Role;
import com.autocare.userservice.entity.User;
import com.autocare.userservice.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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

    /**
     * Lists mechanic accounts that are still waiting for admin approval.
     */
    @GetMapping("/admin/mechanics/pending")
    public ResponseEntity<List<UserResponse>> getPendingMechanics() {
        List<UserResponse> users = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.MECHANIC
                        && u.getStatus() == AccountStatus.PENDING)
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    /**
     * Approves a pending mechanic registration — unlocks login for that account.
     */
    @PutMapping("/admin/mechanics/{id}/approve")
    public ResponseEntity<?> approveMechanic(@PathVariable Long id) {
        return updateMechanicStatus(id, AccountStatus.APPROVED, "Mechanic approved");
    }

    /**
     * Rejects a pending mechanic registration — the account stays blocked.
     */
    @PutMapping("/admin/mechanics/{id}/reject")
    public ResponseEntity<?> rejectMechanic(@PathVariable Long id) {
        return updateMechanicStatus(id, AccountStatus.REJECTED, "Mechanic rejected");
    }

    private ResponseEntity<?> updateMechanicStatus(Long id, AccountStatus status, String okMessage) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found with id: " + id));
        }
        if (user.getRole() != Role.MECHANIC) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Only mechanic accounts can be reviewed"));
        }
        user.setStatus(status);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", okMessage, "id", id, "status", status.name()));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt()
        );
    }
}
