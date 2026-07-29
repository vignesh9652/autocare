package com.autocare.sparepartsservice.controller;

import com.autocare.sparepartsservice.dto.SparePartRequest;
import com.autocare.sparepartsservice.dto.SparePartResponse;
import com.autocare.sparepartsservice.service.SparePartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/parts")
public class SparePartController {

    private final SparePartService sparePartService;

    public SparePartController(SparePartService sparePartService) {
        this.sparePartService = sparePartService;
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
}
