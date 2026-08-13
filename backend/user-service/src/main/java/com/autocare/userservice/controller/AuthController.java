package com.autocare.userservice.controller;

import com.autocare.userservice.dto.AuthResponse;
import com.autocare.userservice.dto.LoginRequest;
import com.autocare.userservice.dto.RegisterRequest;
import com.autocare.userservice.entity.AccountStatus;
import com.autocare.userservice.entity.Role;
import com.autocare.userservice.entity.User;
import com.autocare.userservice.repository.UserRepository;
import com.autocare.userservice.service.OtpService;
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
    private final OtpService otpService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtil jwtUtil,
                          OtpService otpService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.otpService = otpService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        // Normalize before uniqueness check + persistence. The DB lookup is
        // case-sensitive, so without this "John@X.com" and "john@x.com" would
        // both register, and a later login with a different case would fail.
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
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
                email,
                passwordEncoder.encode(request.getPassword()),
                normalizePhone(request.getPhone()),
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

    /**
     * Strips any +91 prefix / separators so stored numbers are always a clean
     * 10-digit Indian mobile format (e.g. "+91 98765 43210" → "9876543210").
     */
    private static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return phone;
        }
        String digits = phone.replaceAll("\\D", "");
        return digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
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

    /**
     * Requests a password-reset OTP for an existing email.
     * Returns the OTP in the response for demo purposes (a real app
     * would email/SMS it and never echo it back).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        email = email.trim().toLowerCase();
        if (userRepository.findByEmail(email).isEmpty()) {
            // Do not reveal whether the account exists
            return ResponseEntity.ok(Map.of(
                    "message", "If an account exists for that email, an OTP has been sent",
                    "otp", otpService.generateOtp(email)
            ));
        }
        String otp = otpService.generateOtp(email);
        return ResponseEntity.ok(Map.of(
                "message", "Password reset OTP sent to your email",
                "otp", otp
        ));
    }

    /**
     * Verifies an OTP without changing anything. Returns true/false.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        if (email == null || otp == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required"));
        }
        boolean valid = otpService.verify(email.trim().toLowerCase(), otp);
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    /**
     * Resets the user's password after OTP verification.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");

        if (email == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email, OTP and new password are required"));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
        }

        email = email.trim().toLowerCase();
        if (!otpService.verify(email, otp)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid or expired OTP"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now sign in."));
    }
}
