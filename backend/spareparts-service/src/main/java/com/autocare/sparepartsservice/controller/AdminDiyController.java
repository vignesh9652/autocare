package com.autocare.sparepartsservice.controller;

import com.autocare.sparepartsservice.dto.DiyGuideRequest;
import com.autocare.sparepartsservice.dto.DiyGuideResponse;
import com.autocare.sparepartsservice.dto.DiyStepRequest;
import com.autocare.sparepartsservice.dto.DiyStepResponse;
import com.autocare.sparepartsservice.entity.DiyStatus;
import com.autocare.sparepartsservice.service.DiyGuideService;
import com.autocare.sparepartsservice.util.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Admin DIY guide management. All endpoints are ADMIN-only (enforced by
 * SecurityConfig). Routed to this service by the gateway's
 * {@code /api/admin/diy-guides/**} rule.
 */
@RestController
@RequestMapping("/api/admin/diy-guides")
public class AdminDiyController {

    private final DiyGuideService diyGuideService;
    private final FileStorageService fileStorageService;

    public AdminDiyController(DiyGuideService diyGuideService,
                              FileStorageService fileStorageService) {
        this.diyGuideService = diyGuideService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping
    public ResponseEntity<DiyGuideResponse> createGuide(@Valid @RequestBody DiyGuideRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(diyGuideService.createGuide(request));
    }

    @GetMapping
    public ResponseEntity<List<DiyGuideResponse>> getAllGuides() {
        return ResponseEntity.ok(diyGuideService.getAllGuides());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiyGuideResponse> getGuide(@PathVariable Long id) {
        return ResponseEntity.ok(diyGuideService.getGuide(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiyGuideResponse> updateGuide(
            @PathVariable Long id, @Valid @RequestBody DiyGuideRequest request) {
        return ResponseEntity.ok(diyGuideService.updateGuide(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteGuide(@PathVariable Long id) {
        diyGuideService.deleteGuide(id);
        return ResponseEntity.ok(Map.of("message", "DIY guide deleted"));
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<DiyGuideResponse> publishGuide(@PathVariable Long id) {
        return ResponseEntity.ok(diyGuideService.setStatus(id, DiyStatus.PUBLISHED));
    }

    @PostMapping("/{id}/unpublish")
    public ResponseEntity<DiyGuideResponse> unpublishGuide(@PathVariable Long id) {
        return ResponseEntity.ok(diyGuideService.setStatus(id, DiyStatus.DRAFT));
    }

    // ─── Steps ─────────────────────────────────────────────────────────────

    @GetMapping("/{id}/steps")
    public ResponseEntity<List<DiyStepResponse>> getSteps(@PathVariable Long id) {
        return ResponseEntity.ok(diyGuideService.getSteps(id));
    }

    @PostMapping("/{id}/steps")
    public ResponseEntity<DiyStepResponse> addStep(
            @PathVariable Long id, @Valid @RequestBody DiyStepRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(diyGuideService.addStep(id, request));
    }

    @PutMapping("/{id}/steps/{stepId}")
    public ResponseEntity<DiyStepResponse> updateStep(
            @PathVariable Long id, @PathVariable Long stepId,
            @Valid @RequestBody DiyStepRequest request) {
        return ResponseEntity.ok(diyGuideService.updateStep(id, stepId, request));
    }

    @DeleteMapping("/{id}/steps/{stepId}")
    public ResponseEntity<Map<String, String>> deleteStep(
            @PathVariable Long id, @PathVariable Long stepId) {
        diyGuideService.deleteStep(id, stepId);
        return ResponseEntity.ok(Map.of("message", "Step deleted"));
    }

    /** Uploads an image for a step (multipart). */
    @PostMapping("/{id}/steps/{stepId}/image")
    public ResponseEntity<DiyStepResponse> uploadStepImage(
            @PathVariable Long id, @PathVariable Long stepId,
            @RequestParam("file") MultipartFile file) {
        String imageUrl = fileStorageService.storeImage(file);
        return ResponseEntity.ok(diyGuideService.setStepImage(id, stepId, imageUrl));
    }
}
