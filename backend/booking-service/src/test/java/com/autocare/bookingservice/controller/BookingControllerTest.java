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

import java.math.BigDecimal;
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
                "123 Main St", 12.9716, 77.5946, null, LocalDateTime.now());
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
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.latitude").value(12.9716))
                .andExpect(jsonPath("$.longitude").value(77.5946));
    }

    @Test
    void createBooking_WithLocationAndEstimate_ShouldForwardFields() throws Exception {
        BookingRequest req = createSampleRequest();
        req.setLatitude(12.9716);
        req.setLongitude(77.5946);
        req.setEstimatedAmount(new BigDecimal("2798.00"));

        when(bookingService.createBooking(eq(userId), any(BookingRequest.class)))
                .thenReturn(createSampleResponse());

        mockMvc.perform(post("/api/bookings")
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // GPS coordinates + cost estimate are forwarded to the service layer
        org.mockito.Mockito.verify(bookingService)
                .createBooking(eq(userId), org.mockito.ArgumentMatchers.argThat(
                        r -> r.getLatitude() != null && r.getLatitude() == 12.9716
                                && r.getLongitude() != null && r.getLongitude() == 77.5946
                                && r.getEstimatedAmount() != null
                                && r.getEstimatedAmount().compareTo(new BigDecimal("2798.00")) == 0));
    }

    @Test
    void createBooking_WithChosenMechanic_ShouldPassMechanicId() throws Exception {
        BookingRequest req = createSampleRequest();
        req.setMechanicId(99L);

        when(bookingService.createBooking(eq(userId), any(BookingRequest.class)))
                .thenReturn(createSampleResponse());

        mockMvc.perform(post("/api/bookings")
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // The chosen mechanic id is forwarded to the service layer
        org.mockito.Mockito.verify(bookingService)
                .createBooking(eq(userId), org.mockito.ArgumentMatchers.argThat(
                        r -> r.getMechanicId() != null && r.getMechanicId() == 99L));
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
    void createBooking_WithOutOfRangeCoordinates_ShouldReturn400() throws Exception {
        BookingRequest req = createSampleRequest();
        req.setLatitude(91.5);   // invalid: must be within [-90, 90]
        req.setLongitude(200.0); // invalid: must be within [-180, 180]

        mockMvc.perform(post("/api/bookings")
                        .with(authentication(auth()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation failed"));
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
        when(bookingService.updateBookingStatus(eq(bookingId), eq(BookingStatus.ACCEPTED), eq(userId), eq("CUSTOMER")))
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
        when(bookingService.updateBookingStatus(eq(bookingId), eq(BookingStatus.IN_PROGRESS), eq(userId), eq("CUSTOMER")))
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

    // ─── GET /api/bookings/mechanic/assigned ───────────────────────────

    @Test
    void getMechanicBookings_ShouldReturn200() throws Exception {
        when(bookingService.getMechanicBookings(userId))
                .thenReturn(List.of(createSampleResponse()));

        mockMvc.perform(get("/api/bookings/mechanic/assigned")
                        .with(authentication(auth())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].serviceType").value("Oil Change"));
    }

    // ─── UNAUTHENTICATED ───────────────────────────────────────────────

    @Test
    void anyEndpoint_WithoutAuth_ShouldReturn401() throws Exception {
        // Missing/invalid JWT → 401 (custom JSON authentication entry point).
        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isUnauthorized());
    }
}
