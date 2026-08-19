package com.autocare.bookingservice.controller;

import com.autocare.bookingservice.dto.CommissionConfigRequest;
import com.autocare.bookingservice.dto.CommissionConfigResponse;
import com.autocare.bookingservice.dto.InstallationFeeConfigRequest;
import com.autocare.bookingservice.dto.InstallationFeeConfigResponse;
import com.autocare.bookingservice.dto.ServiceRequest;
import com.autocare.bookingservice.dto.ServiceResponse;
import com.autocare.bookingservice.service.ServiceCatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Platform service catalogue.
 *
 * <ul>
 *   <li>{@code GET /api/services} — public listing of active services
 *       (landing page + customers picking services when booking).</li>
 *   <li>{@code /api/services/admin/**} — ADMIN-only management of prices,
 *       active flags and the platform commission percentage.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/services")
public class ServiceCatalogController {

    private final ServiceCatalogService serviceCatalogService;

    public ServiceCatalogController(ServiceCatalogService serviceCatalogService) {
        this.serviceCatalogService = serviceCatalogService;
    }

    @GetMapping
    public ResponseEntity<List<ServiceResponse>> getActiveServices() {
        return ResponseEntity.ok(serviceCatalogService.getActiveServices());
    }

    // ─── Admin ─────────────────────────────────────────────────────────────

    @GetMapping("/admin/all")
    public ResponseEntity<List<ServiceResponse>> getAllServices() {
        return ResponseEntity.ok(serviceCatalogService.getAllServices());
    }

    @PostMapping("/admin")
    public ResponseEntity<ServiceResponse> createService(
            @Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceCatalogService.createService(request));
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<ServiceResponse> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequest request) {
        return ResponseEntity.ok(serviceCatalogService.updateService(id, request));
    }

    @GetMapping("/admin/config")
    public ResponseEntity<CommissionConfigResponse> getCommissionConfig() {
        return ResponseEntity.ok(serviceCatalogService.getCommissionConfig());
    }

    @PutMapping("/admin/config")
    public ResponseEntity<CommissionConfigResponse> updateCommissionConfig(
            @Valid @RequestBody CommissionConfigRequest request) {
        return ResponseEntity.ok(serviceCatalogService.updateCommissionConfig(request));
    }

    /** Spare-part installation fee (₹) — admin configurable. */
    @GetMapping("/admin/installation-fee")
    public ResponseEntity<InstallationFeeConfigResponse> getInstallationFee() {
        return ResponseEntity.ok(serviceCatalogService.getInstallationFeeConfig());
    }

    @PutMapping("/admin/installation-fee")
    public ResponseEntity<InstallationFeeConfigResponse> updateInstallationFee(
            @Valid @RequestBody InstallationFeeConfigRequest request) {
        return ResponseEntity.ok(serviceCatalogService.updateInstallationFeeConfig(request));
    }
}
