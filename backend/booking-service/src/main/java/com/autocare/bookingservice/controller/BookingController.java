package com.autocare.bookingservice.controller;

import com.autocare.bookingservice.dto.BookingRequest;
import com.autocare.bookingservice.dto.BookingResponse;
import com.autocare.bookingservice.dto.BookingStatusUpdateRequest;
import com.autocare.bookingservice.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        BookingResponse response = bookingService.createBooking(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<BookingResponse>> getUserBookings(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<BookingResponse> bookings = bookingService.getUserBookings(userId);
        return ResponseEntity.ok(bookings);
    }

    /**
     * All bookings across all users. Admin-only — requires the ADMIN role
     * (enforced by SecurityConfig). Consumed by the admin-service aggregation
     * layer (BookingServiceClient).
     */
    @GetMapping("/admin/all")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        List<BookingResponse> bookings = bookingService.getAllBookings();
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBookingById(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        BookingResponse response = bookingService.getBookingById(id, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Bookings assigned to the logged-in mechanic (mechanic role). Resolves
     * the mechanic profile from the JWT subject via mechanic-service.
     */
    @GetMapping("/mechanic/assigned")
    public ResponseEntity<List<BookingResponse>> getMechanicBookings(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<BookingResponse> bookings = bookingService.getMechanicBookings(userId);
        return ResponseEntity.ok(bookings);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<BookingResponse> updateBookingStatus(
            @PathVariable Long id,
            @Valid @RequestBody BookingStatusUpdateRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> authority.substring(5))
                .findFirst()
                .orElse("CUSTOMER");
        BookingResponse response = bookingService.updateBookingStatus(id, request.getStatus(), userId, role);
        return ResponseEntity.ok(response);
    }
}
