package com.autocare.mechanicservice.controller;

import com.autocare.mechanicservice.dto.*;
import com.autocare.mechanicservice.service.MechanicService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mechanics")
public class MechanicController {

    private final MechanicService mechanicService;

    public MechanicController(MechanicService mechanicService) {
        this.mechanicService = mechanicService;
    }

    @PostMapping
    public ResponseEntity<MechanicResponse> createMechanic(
            @Valid @RequestBody MechanicRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        MechanicResponse response = mechanicService.createMechanic(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<MechanicResponse>> getAllMechanics(
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String area) {
        List<MechanicResponse> mechanics = mechanicService.getAllMechanics(available, skill, area);
        return ResponseEntity.ok(mechanics);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MechanicResponse> getMechanicById(@PathVariable Long id) {
        MechanicResponse response = mechanicService.getMechanicById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Resolves the mechanic profile linked to a user account. Used by
     * booking-service to map a mechanic's JWT (userId) to their profile id.
     */
    @GetMapping("/by-user/{userId}")
    public ResponseEntity<MechanicResponse> getMechanicByUserId(@PathVariable Long userId) {
        MechanicResponse response = mechanicService.getMechanicByUserId(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MechanicResponse> updateMechanic(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMechanicRequest request) {
        MechanicResponse response = mechanicService.updateMechanic(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/availability")
    public ResponseEntity<MechanicResponse> updateAvailability(
            @PathVariable Long id,
            @Valid @RequestBody AvailabilityUpdateRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        MechanicResponse response = mechanicService.updateAvailability(id, userId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/rating")
    public ResponseEntity<MechanicResponse> updateRating(
            @PathVariable Long id,
            @Valid @RequestBody RatingUpdateRequest request) {
        MechanicResponse response = mechanicService.updateRating(id, request);
        return ResponseEntity.ok(response);
    }
}
