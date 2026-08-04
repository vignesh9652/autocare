package com.autocare.mechanicservice.controller;

import com.autocare.mechanicservice.dto.*;
import com.autocare.mechanicservice.entity.AvailabilityStatus;
import com.autocare.mechanicservice.exception.MechanicNotFoundException;
import com.autocare.mechanicservice.service.MechanicService;
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

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MechanicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MechanicService mechanicService;

    private final Long userId = 1L;
    private final Long mechanicId = 100L;

    private UsernamePasswordAuthenticationToken auth() {
        return new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
    }

    private MechanicResponse createSampleResponse() {
        return new MechanicResponse(mechanicId, "John Mechanic", "9876543210",
                "mechanic@test.com", List.of("ENGINE", "BRAKES"), "560001",
                AvailabilityStatus.AVAILABLE, 0.0, 0);
    }

    private MechanicRequest createSampleRequest() {
        MechanicRequest req = new MechanicRequest();
        req.setName("John Mechanic");
        req.setPhone("9876543210");
        req.setEmail("mechanic@test.com");
        req.setSkills(List.of("ENGINE", "BRAKES"));
        req.setServiceArea("560001");
        return req;
    }

    // ─── POST /api/mechanics ────────────────────────────────────────────

    @Test
    void createMechanic_ShouldReturn201() throws Exception {
        MechanicResponse response = createSampleResponse();
        when(mechanicService.createMechanic(eq(userId), any(MechanicRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/mechanics")
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createSampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(mechanicId))
                .andExpect(jsonPath("$.name").value("John Mechanic"))
                .andExpect(jsonPath("$.email").value("mechanic@test.com"))
                .andExpect(jsonPath("$.availabilityStatus").value("AVAILABLE"));
    }

    @Test
    void createMechanic_WithInvalidInput_ShouldReturn400() throws Exception {
        MechanicRequest invalidReq = new MechanicRequest();

        mockMvc.perform(post("/api/mechanics")
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors").exists());
    }

    // ─── GET /api/mechanics ─────────────────────────────────────────────

    @Test
    void getAllMechanics_ShouldReturn200() throws Exception {
        when(mechanicService.getAllMechanics(null, null, null))
                .thenReturn(List.of(createSampleResponse()));

        mockMvc.perform(get("/api/mechanics")
                        .with(authentication(auth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].name").value("John Mechanic"));
    }

    @Test
    void getAllMechanics_WithFilters_ShouldPassParams() throws Exception {
        when(mechanicService.getAllMechanics(true, "ENGINE", "560001"))
                .thenReturn(List.of(createSampleResponse()));

        mockMvc.perform(get("/api/mechanics")
                        .param("available", "true")
                        .param("skill", "ENGINE")
                        .param("area", "560001")
                        .with(authentication(auth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1));

        // No need to verify service call - integration test just checks wiring
    }

    // ─── GET /api/mechanics/{id} ─────────────────────────────────────────

    @Test
    void getMechanicById_ShouldReturn200() throws Exception {
        when(mechanicService.getMechanicById(mechanicId))
                .thenReturn(createSampleResponse());

        mockMvc.perform(get("/api/mechanics/{id}", mechanicId)
                        .with(authentication(auth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(mechanicId));
    }

    @Test
    void getMechanicById_WithNonExistentId_ShouldReturn404() throws Exception {
        when(mechanicService.getMechanicById(999L))
                .thenThrow(new MechanicNotFoundException("Mechanic not found with id: 999"));

        mockMvc.perform(get("/api/mechanics/{id}", 999)
                        .with(authentication(auth())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Mechanic not found with id: 999"));
    }

    // ─── PUT /api/mechanics/{id} ─────────────────────────────────────────

    @Test
    void updateMechanic_ShouldReturn200() throws Exception {
        MechanicResponse updated = new MechanicResponse(mechanicId, "John Updated", "9000000000",
                "mechanic@test.com", List.of("ENGINE"), "560002",
                AvailabilityStatus.AVAILABLE, 0.0, 0);
        when(mechanicService.updateMechanic(eq(mechanicId), any(UpdateMechanicRequest.class)))
                .thenReturn(updated);

        UpdateMechanicRequest updateReq = new UpdateMechanicRequest();
        updateReq.setName("John Updated");
        updateReq.setPhone("9000000000");

        mockMvc.perform(put("/api/mechanics/{id}", mechanicId)
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("John Updated"));
    }

    // ─── PUT /api/mechanics/{id}/availability ────────────────────────────

    @Test
    void updateAvailability_ShouldReturn200() throws Exception {
        MechanicResponse busyResponse = new MechanicResponse(mechanicId, "John Mechanic",
                "9876543210", "mechanic@test.com", List.of("ENGINE", "BRAKES"), "560001",
                AvailabilityStatus.BUSY, 0.0, 0);
        when(mechanicService.updateAvailability(eq(mechanicId), eq(userId),
                any(AvailabilityUpdateRequest.class)))
                .thenReturn(busyResponse);

        AvailabilityUpdateRequest availReq = new AvailabilityUpdateRequest();
        availReq.setAvailabilityStatus(AvailabilityStatus.BUSY);

        mockMvc.perform(put("/api/mechanics/{id}/availability", mechanicId)
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(availReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.availabilityStatus").value("BUSY"));
    }

    // ─── PUT /api/mechanics/{id}/rating ──────────────────────────────────

    @Test
    void updateRating_ShouldReturn200() throws Exception {
        MechanicResponse ratedResponse = new MechanicResponse(mechanicId, "John Mechanic",
                "9876543210", "mechanic@test.com", List.of("ENGINE", "BRAKES"), "560001",
                AvailabilityStatus.AVAILABLE, 4.5, 1);
        when(mechanicService.updateRating(eq(mechanicId), any(RatingUpdateRequest.class)))
                .thenReturn(ratedResponse);

        RatingUpdateRequest ratingReq = new RatingUpdateRequest();
        ratingReq.setNewRating(4.5);

        mockMvc.perform(put("/api/mechanics/{id}/rating", mechanicId)
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ratingReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(4.5))
                .andExpect(jsonPath("$.totalJobsCompleted").value(1));
    }

    // ─── UNAUTHENTICATED ────────────────────────────────────────────────

    @Test
    void anyEndpoint_WithoutAuth_ShouldReturn403() throws Exception {
        // GET /api/mechanics is a public listing endpoint (permitAll),
        // so test a protected endpoint instead.
        mockMvc.perform(get("/api/mechanics/{id}", mechanicId))
                .andExpect(status().isForbidden());
    }
}
