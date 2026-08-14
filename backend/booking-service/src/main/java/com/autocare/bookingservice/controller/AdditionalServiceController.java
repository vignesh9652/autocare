package com.autocare.bookingservice.controller;

import com.autocare.bookingservice.dto.AdditionalServiceCreateRequest;
import com.autocare.bookingservice.dto.AdditionalServiceResponse;
import com.autocare.bookingservice.service.AdditionalServiceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Additional Service / Vehicle Inspection endpoints.
 *
 * <ul>
 *   <li>{@code POST /api/additional-services} — MECHANIC raises a request
 *       (booking + catalogue service id + reason; price resolved server-side).</li>
 *   <li>{@code GET /api/additional-services/booking/{bookingId}} — customer,
 *       assigned mechanic or admin lists the requests for a booking.</li>
 *   <li>{@code POST /api/additional-services/{id}/approve|reject} — the booking's
 *       customer decides.</li>
 *   <li>{@code GET /api/additional-services/admin/all} — ADMIN view.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/additional-services")
public class AdditionalServiceController {

    private final AdditionalServiceService additionalServiceService;

    public AdditionalServiceController(AdditionalServiceService additionalServiceService) {
        this.additionalServiceService = additionalServiceService;
    }

    @PostMapping
    public ResponseEntity<AdditionalServiceResponse> create(
            @Valid @RequestBody AdditionalServiceCreateRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        AdditionalServiceResponse response =
                additionalServiceService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<AdditionalServiceResponse>> getByBooking(
            @PathVariable Long bookingId,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<AdditionalServiceResponse> responses =
                additionalServiceService.getByBooking(bookingId, userId, roleOf(authentication));
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<AdditionalServiceResponse>> getAllForAdmin() {
        return ResponseEntity.ok(additionalServiceService.getAllForAdmin());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<AdditionalServiceResponse> approve(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(additionalServiceService.approve(id, userId));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<AdditionalServiceResponse> reject(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(additionalServiceService.reject(id, userId));
    }

    private String roleOf(Authentication authentication) {
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            String role = authority.getAuthority();
            if (role != null && role.startsWith("ROLE_")) {
                return role.substring("ROLE_".length());
            }
        }
        return null;
    }
}
