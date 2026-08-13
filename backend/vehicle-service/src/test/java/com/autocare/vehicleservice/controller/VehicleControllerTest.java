package com.autocare.vehicleservice.controller;

import com.autocare.vehicleservice.dto.VehicleRequest;
import com.autocare.vehicleservice.dto.VehicleResponse;
import com.autocare.vehicleservice.entity.VehicleType;
import com.autocare.vehicleservice.exception.VehicleNotFoundException;
import com.autocare.vehicleservice.service.VehicleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VehicleService vehicleService;

    private final Long userId = 1L;
    private final Long vehicleId = 100L;

    private UsernamePasswordAuthenticationToken auth() {
        return new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
    }

    private VehicleResponse createSampleResponse() {
        return new VehicleResponse(vehicleId, userId, "Toyota", "Camry", 2022,
                "ABC-1234", VehicleType.CAR, LocalDateTime.now());
    }

    private VehicleRequest createSampleRequest() {
        VehicleRequest req = new VehicleRequest();
        req.setMake("Toyota");
        req.setModel("Camry");
        req.setYear(2022);
        req.setRegistrationNumber("ABC-1234");
        req.setVehicleType(VehicleType.CAR);
        return req;
    }

    // ─── POST /api/vehicles ───────────────────────────────────────────────

    @Test
    void createVehicle_ShouldReturn201() throws Exception {
        VehicleResponse response = createSampleResponse();
        when(vehicleService.createVehicle(eq(userId), any(VehicleRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/vehicles")
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createSampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(vehicleId))
                .andExpect(jsonPath("$.make").value("Toyota"))
                .andExpect(jsonPath("$.registrationNumber").value("ABC-1234"));
    }

    @Test
    void createVehicle_WithInvalidInput_ShouldReturn400() throws Exception {
        VehicleRequest invalidReq = new VehicleRequest();

        mockMvc.perform(post("/api/vehicles")
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors").exists());
    }

    // ─── GET /api/vehicles ────────────────────────────────────────────────

    @Test
    void getUserVehicles_ShouldReturn200() throws Exception {
        when(vehicleService.getUserVehicles(userId))
                .thenReturn(List.of(createSampleResponse()));

        mockMvc.perform(get("/api/vehicles")
                        .with(authentication(auth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].make").value("Toyota"));
    }

    // ─── GET /api/vehicles/{id} ────────────────────────────────────────────

    @Test
    void getVehicleById_ShouldReturn200() throws Exception {
        when(vehicleService.getVehicleById(vehicleId, userId))
                .thenReturn(createSampleResponse());

        mockMvc.perform(get("/api/vehicles/{id}", vehicleId)
                        .with(authentication(auth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(vehicleId));
    }

    @Test
    void getVehicleById_WithNonExistentId_ShouldReturn404() throws Exception {
        when(vehicleService.getVehicleById(999L, userId))
                .thenThrow(new VehicleNotFoundException("Vehicle not found with id: 999"));

        mockMvc.perform(get("/api/vehicles/{id}", 999)
                        .with(authentication(auth())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Vehicle not found with id: 999"));
    }

    // ─── PUT /api/vehicles/{id} ───────────────────────────────────────────

    @Test
    void updateVehicle_ShouldReturn200() throws Exception {
        VehicleResponse updated = new VehicleResponse(vehicleId, userId, "Honda", "Accord", 2023,
                "ABC-1234", VehicleType.CAR, LocalDateTime.now());
        when(vehicleService.updateVehicle(eq(vehicleId), eq(userId), any(VehicleRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(put("/api/vehicles/{id}", vehicleId)
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createSampleRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.make").value("Honda"));
    }

    // ─── DELETE /api/vehicles/{id} ────────────────────────────────────────

    @Test
    void deleteVehicle_ShouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/vehicles/{id}", vehicleId)
                        .with(authentication(auth())))
                .andExpect(status().isNoContent());
    }

    // ─── UNAUTHENTICATED ──────────────────────────────────────────────────

    @Test
    void anyEndpoint_WithoutAuth_ShouldReturn401() throws Exception {
        // Missing/invalid JWT → 401 (custom JSON authentication entry point).
        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isUnauthorized());
    }
}
