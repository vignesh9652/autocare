package com.autocare.bookingservice.controller;

import com.autocare.bookingservice.dto.BookingRequest;
import com.autocare.bookingservice.dto.BookingResponse;
import com.autocare.bookingservice.dto.BookingStatusUpdateRequest;
import com.autocare.bookingservice.entity.BookingStatus;
import com.autocare.bookingservice.exception.BookingNotFoundException;
import com.autocare.bookingservice.exception.InvalidStatusTransitionException;
import com.autocare.bookingservice.exception.NoAvailableMechanicException;
import com.autocare.bookingservice.service.BookingService;
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

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookingService bookingService;

    private final Long userId = 1L;
    private final Long bookingId = 100L;
    private final Long mechanicId = 20L;

    private UsernamePasswordAuthenticationToken auth() {
        return new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
    }

    private BookingResponse createSampleResponse() {
        return new BookingResponse(bookingId, userId, 10L, mechanicId,
                "Oil Change", BookingStatus.PENDING,
                LocalDateTime.of(2026, 8, 1, 10, 0),
                "123 Main St", null, LocalDateTime.now());
    }

    private BookingRequest createSampleRequest() {
        BookingRequest req = new BookingRequest();
        req.setVehicleId(10L);
        req.setServiceType("Oil Change");
        req.setScheduledAt(LocalDateTime.of(2026, 8, 1, 10, 0));
        req.setAddress("123 Main St");
        req.setPreferredSkill("Oil Change");
        req.setServiceArea("Downtown");
        return req;
    }

    // ─── POST /api/bookings ────────────────────────────────────────────

    @Test
    void createBooking_ShouldReturn201() throws Exception {
        when(bookingService.createBooking(eq(userId), any(BookingRequest.class)))
                .thenReturn(createSampleResponse());

        mockMvc.perform(post("/api/bookings")
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createSampleRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(bookingId))
                .andExpect(jsonPath("$.serviceType").value("Oil Change"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void createBooking_WithInvalidInput_ShouldReturn400() throws Exception {
        BookingRequest invalidReq = new BookingRequest();

        mockMvc.perform(post("/api/bookings")
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors").exists());
    }

    @Test
    void createBooking_WhenNoMechanic_ShouldReturn404() throws Exception {
        when(bookingService.createBooking(eq(userId), any(BookingRequest.class)))
                .thenThrow(new NoAvailableMechanicException("No mechanic available"));

        mockMvc.perform(post("/api/bookings")
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createSampleRequest())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("No mechanic available"));
    }

    // ─── GET /api/bookings ─────────────────────────────────────────────

    @Test
    void getUserBookings_ShouldReturn200() throws Exception {
        when(bookingService.getUserBookings(userId))
                .thenReturn(List.of(createSampleResponse()));

        mockMvc.perform(get("/api/bookings")
                        .with(authentication(auth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].serviceType").value("Oil Change"));
    }

    @Test
    void getUserBookings_WithNoBookings_ShouldReturnEmptyArray() throws Exception {
        when(bookingService.getUserBookings(userId))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/bookings")
                        .with(authentication(auth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(0));
    }

    // ─── GET /api/bookings/{id} ────────────────────────────────────────

    @Test
    void getBookingById_ShouldReturn200() throws Exception {
        when(bookingService.getBookingById(bookingId, userId))
                .thenReturn(createSampleResponse());

        mockMvc.perform(get("/api/bookings/{id}", bookingId)
                        .with(authentication(auth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(bookingId));
    }

    @Test
    void getBookingById_WithNonExistentId_ShouldReturn404() throws Exception {
        when(bookingService.getBookingById(999L, userId))
                .thenThrow(new BookingNotFoundException("Booking not found with id: 999"));

        mockMvc.perform(get("/api/bookings/{id}", 999)
                        .with(authentication(auth())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Booking not found with id: 999"));
    }

    // ─── PUT /api/bookings/{id}/status ─────────────────────────────────

    @Test
    void updateBookingStatus_ShouldReturn200() throws Exception {
        BookingResponse updated = new BookingResponse(bookingId, userId, 10L, mechanicId,
                "Oil Change", BookingStatus.ACCEPTED,
                LocalDateTime.of(2026, 8, 1, 10, 0),
                "123 Main St", null, LocalDateTime.now());
        when(bookingService.updateBookingStatus(eq(bookingId), eq(BookingStatus.ACCEPTED), eq(userId)))
                .thenReturn(updated);

        BookingStatusUpdateRequest statusReq = new BookingStatusUpdateRequest();
        statusReq.setStatus(BookingStatus.ACCEPTED);

        mockMvc.perform(put("/api/bookings/{id}/status", bookingId)
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
    }

    @Test
    void updateBookingStatus_WithInvalidTransition_ShouldReturn400() throws Exception {
        when(bookingService.updateBookingStatus(eq(bookingId), eq(BookingStatus.IN_PROGRESS), eq(userId)))
                .thenThrow(new InvalidStatusTransitionException(
                        "Cannot transition from PENDING to IN_PROGRESS"));

        BookingStatusUpdateRequest statusReq = new BookingStatusUpdateRequest();
        statusReq.setStatus(BookingStatus.IN_PROGRESS);

        mockMvc.perform(put("/api/bookings/{id}/status", bookingId)
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Cannot transition from PENDING to IN_PROGRESS"));
    }

    @Test
    void updateBookingStatus_WithNullStatus_ShouldReturn400() throws Exception {
        BookingStatusUpdateRequest statusReq = new BookingStatusUpdateRequest();

        mockMvc.perform(put("/api/bookings/{id}/status", bookingId)
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(statusReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"));
    }

    // ─── UNAUTHENTICATED ───────────────────────────────────────────────

    @Test
    void anyEndpoint_WithoutAuth_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isForbidden());
    }
}
