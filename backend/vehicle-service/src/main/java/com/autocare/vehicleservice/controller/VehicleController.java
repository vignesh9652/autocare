package com.autocare.vehicleservice.controller;

import com.autocare.vehicleservice.dto.VehicleRequest;
import com.autocare.vehicleservice.dto.VehicleResponse;
import com.autocare.vehicleservice.service.VehicleService;
import com.autocare.vehicleservice.util.FileStorageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;
    private final FileStorageService fileStorageService;

    public VehicleController(VehicleService vehicleService,
                             FileStorageService fileStorageService) {
        this.vehicleService = vehicleService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping
    public ResponseEntity<VehicleResponse> createVehicle(
            @Valid @RequestBody VehicleRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        VehicleResponse response = vehicleService.createVehicle(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<VehicleResponse>> getUserVehicles(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<VehicleResponse> vehicles = vehicleService.getUserVehicles(userId);
        return ResponseEntity.ok(vehicles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponse> getVehicleById(
            @PathVariable Long id,
            Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            VehicleResponse response = vehicleService.getVehicleById(id, userId);
            return ResponseEntity.ok(response);
        }
        // Allow inter-service calls without auth (ownership validated by calling service)
        VehicleResponse response = vehicleService.getVehicleByIdPublic(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleResponse> updateVehicle(
            @PathVariable Long id,
            @Valid @RequestBody VehicleRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        VehicleResponse response = vehicleService.updateVehicle(id, userId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        vehicleService.deleteVehicle(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Upload a photo for the user's vehicle.
     */
    @PostMapping("/{id}/image")
    public ResponseEntity<?> uploadVehicleImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        String imageUrl = fileStorageService.storeImage(file);
        vehicleService.updateImageUrl(id, userId, imageUrl);
        VehicleResponse response = vehicleService.getVehicleById(id, userId);
        return ResponseEntity.ok(Map.of(
                "message", "Image uploaded",
                "imageUrl", imageUrl,
                "vehicle", response
        ));
    }
}
