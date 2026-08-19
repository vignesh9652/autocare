package com.autocare.sparepartsservice.controller;

import com.autocare.sparepartsservice.dto.SparePartRequest;
import com.autocare.sparepartsservice.dto.SparePartResponse;
import com.autocare.sparepartsservice.service.SparePartService;
import com.autocare.sparepartsservice.util.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parts")
public class SparePartController {

    private final SparePartService sparePartService;
    private final FileStorageService fileStorageService;

    public SparePartController(SparePartService sparePartService,
                               FileStorageService fileStorageService) {
        this.sparePartService = sparePartService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping
    public ResponseEntity<SparePartResponse> createPart(
            @Valid @RequestBody SparePartRequest request,
            Authentication authentication) {
        // Authenticated — admin or mechanic can add parts
        SparePartResponse response = sparePartService.createPart(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<SparePartResponse>> getAllParts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        List<SparePartResponse> parts = sparePartService.getAllParts(category, search);
        return ResponseEntity.ok(parts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SparePartResponse> getPartById(@PathVariable Long id) {
        SparePartResponse response = sparePartService.getPartById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Upload a product image for a spare part (admin/mechanic only —
     * any authenticated user today, matching the POST /api/parts rule).
     */
    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadPartImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        // Require a valid token (same rule as creating parts)
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized - valid token required"));
        }
        String imageUrl = fileStorageService.storeImage(file);
        sparePartService.updateImageUrl(id, imageUrl);
        SparePartResponse response = sparePartService.getPartById(id);
        return ResponseEntity.ok(Map.of(
                "message", "Image uploaded",
                "imageUrl", imageUrl,
                "part", response
        ));
    }
}
