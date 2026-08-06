package com.autocare.userservice.controller;

import com.autocare.userservice.dto.LoginRequest;
import com.autocare.userservice.dto.RegisterRequest;
import com.autocare.userservice.entity.AccountStatus;
import com.autocare.userservice.entity.Role;
import com.autocare.userservice.entity.User;
import com.autocare.userservice.repository.UserRepository;
import com.autocare.userservice.security.SecurityConfig;
import com.autocare.userservice.util.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtUtil jwtUtil;

    @Test
    void register_ShouldReturn201() throws Exception {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123", "1234567890");

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-pass");

        User savedUser = new User("Test User", "test@example.com", "encoded-pass", "1234567890", Role.CUSTOMER);
        savedUser.setId(1L);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(jwtUtil.generateToken(1L, "test@example.com", Role.CUSTOMER)).thenReturn("test-token");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("test-token"))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.name").value("Test User"))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    @Test
    void register_WithDuplicateEmail_ShouldReturn409() throws Exception {
        RegisterRequest request = new RegisterRequest("Test User", "existing@example.com", "password123", "1234567890");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("Email is already registered"));
    }

    @Test
    void register_WithInvalidInput_ShouldReturn400() throws Exception {
        RegisterRequest request = new RegisterRequest("", "invalid-email", "12", "");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors").exists());
    }

    @Test
    void login_ShouldReturn200() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        User user = new User("Test User", "test@example.com", "encoded-pass", "1234567890", Role.CUSTOMER);
        user.setId(1L);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded-pass")).thenReturn(true);
        when(jwtUtil.generateToken(1L, "test@example.com", Role.CUSTOMER)).thenReturn("test-token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("test-token"))
                .andExpect(jsonPath("$.userId").value(1));
    }

    @Test
    void login_WithInvalidCredentials_ShouldReturn401() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "wrongpassword");

        User user = new User("Test User", "test@example.com", "encoded-pass", "1234567890", Role.CUSTOMER);
        user.setId(1L);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encoded-pass")).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    void register_AsMechanic_ShouldCreatePendingAccount() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Mech One", "mech@example.com", "password123", "1234567890", Role.MECHANIC);

        when(userRepository.existsByEmail("mech@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded-pass");

        User savedUser = new User("Mech One", "mech@example.com", "encoded-pass", "1234567890", Role.MECHANIC);
        savedUser.setStatus(AccountStatus.PENDING);
        savedUser.setId(2L);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        when(jwtUtil.generateToken(2L, "mech@example.com", Role.MECHANIC)).thenReturn("test-token");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("MECHANIC"));
    }

    @Test
    void register_AsAdmin_ShouldReturn400() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Hacker", "admin@example.com", "password123", "1234567890", Role.ADMIN);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("ADMIN accounts cannot be self-registered"));
    }

    @Test
    void login_WithPendingMechanic_ShouldReturn403() throws Exception {
        LoginRequest request = new LoginRequest("mech@example.com", "password123");

        User user = new User("Mech One", "mech@example.com", "encoded-pass", "1234567890", Role.MECHANIC);
        user.setStatus(AccountStatus.PENDING);
        user.setId(2L);

        when(userRepository.findByEmail("mech@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encoded-pass")).thenReturn(true);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").exists());
    }

    @Test
    void login_WithNonExistentEmail_ShouldReturn401() throws Exception {
        LoginRequest request = new LoginRequest("nobody@example.com", "password123");

        when(userRepository.findByEmail("nobody@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }
}
