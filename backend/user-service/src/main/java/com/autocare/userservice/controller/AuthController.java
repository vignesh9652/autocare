package com.autocare.userservice.controller;

import com.autocare.userservice.dto.AuthResponse;
import com.autocare.userservice.dto.LoginRequest;
import com.autocare.userservice.dto.RegisterRequest;
import com.autocare.userservice.entity.AccountStatus;
import com.autocare.userservice.entity.Role;
import com.autocare.userservice.entity.User;
import com.autocare.userservice.repository.UserRepository;
import com.autocare.userservice.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email is already registered"));
        }

        // Role-based registration: the public endpoint must never mint an ADMIN.
        if (request.getRole() == Role.ADMIN) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "ADMIN accounts cannot be self-registered"));
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getPhone(),
                request.getRole()
        );

        // Mechanics require admin approval before they can log in.
        if (request.getRole() == Role.MECHANIC) {
            user.setStatus(AccountStatus.PENDING);
        }

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        AuthResponse response = new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getRole()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        }

        // Role-based gate: only APPROVED accounts may log in. Mechanic
        // registrations stay PENDING until an admin approves them; rejected
        // accounts remain blocked.
        if (user.getStatus() != null && user.getStatus() != AccountStatus.APPROVED) {
            String message = user.getStatus() == AccountStatus.REJECTED
                    ? "Your account was rejected by the AutoCare Administrator. Contact support for help."
                    : "Your account is pending admin approval. You will be able to log in once the AutoCare Administrator approves your registration.";
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", message));
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        AuthResponse response = new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getRole()
        );

        return ResponseEntity.ok(response);
    }
}
