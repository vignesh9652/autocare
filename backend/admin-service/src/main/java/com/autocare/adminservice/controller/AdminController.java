package com.autocare.adminservice.controller;

import com.autocare.adminservice.dto.DashboardResponse;
import com.autocare.adminservice.dto.ServiceResult;
import com.autocare.adminservice.exception.ServiceUnavailableException;
import com.autocare.adminservice.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Admin-only endpoints. Spring Security (SecurityConfig) enforces that every
 * request here carries a JWT whose role claim is ADMIN — anything else gets a
 * 403 "Forbidden - admin role required".
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminDashboardService adminDashboardService;

    public AdminController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponse> dashboard(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.buildDashboard(authHeader));
    }

    /**
     * Proxy for all bookings. Calls booking-service's (not yet existing)
     * admin-only endpoint — see BookingServiceClient for the TODO.
     */
    @GetMapping("/bookings")
    public ResponseEntity<List<Map<String, Object>>> bookings(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.getAllBookings(authHeader));
    }

    /**
     * Lists all mechanics with their ratings and job counts (works today —
     * mechanic-service's GET /api/mechanics is public).
     */
    @GetMapping("/mechanics")
    public ResponseEntity<List<Map<String, Object>>> mechanics() {
        return ResponseEntity.ok(adminDashboardService.getAllMechanics());
    }

    /**
     * Lists mechanic accounts that are waiting for admin approval
     * (user-service).
     */
    @GetMapping("/mechanics/pending")
    public ResponseEntity<List<Map<String, Object>>> pendingMechanics(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.getPendingMechanics(authHeader));
    }

    /**
     * Approves a pending mechanic registration.
     */
    @PutMapping("/mechanics/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveMechanic(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.approveMechanic(id, authHeader));
    }

    /**
     * Rejects a pending mechanic registration.
     */
    @PutMapping("/mechanics/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectMechanic(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.rejectMechanic(id, authHeader));
    }

    /**
     * Proxy for all payment transactions. Calls payment-service's (not yet
     * existing) admin-only endpoint — see PaymentServiceClient for the TODO.
     */
    @GetMapping("/payments")
    public ResponseEntity<List<Map<String, Object>>> payments(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.getAllTransactions(authHeader));
    }

    /**
     * Bonus: all reviews for a given mechanic (review-service works today).
     */
    @GetMapping("/mechanics/{mechanicId}/reviews")
    public ResponseEntity<List<Map<String, Object>>> mechanicReviews(
            @PathVariable Long mechanicId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.getMechanicReviews(mechanicId, authHeader));
    }

    /**
     * Bonus: a single vehicle by id (vehicle-service detail endpoint works today).
     */
    @GetMapping("/vehicles/{vehicleId}")
    public ResponseEntity<Map<String, Object>> vehicle(@PathVariable Long vehicleId) {
        ServiceResult<Map<String, Object>> result = adminDashboardService.getVehicle(vehicleId);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("vehicle-service is temporarily unavailable");
        }
        return ResponseEntity.ok(result.getData());
    }

    // ── Wallet (module lives in booking-service; proxied here) ────────────

    /**
     * The single platform wallet: balance, total commission, total withdrawn.
     */
    @GetMapping("/wallet")
    public ResponseEntity<Map<String, Object>> wallet(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.getAdminWallet(authHeader));
    }

    /**
     * Full platform wallet ledger.
     */
    @GetMapping("/wallet/transactions")
    public ResponseEntity<List<Map<String, Object>>> walletTransactions(
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.getAdminWalletTransactions(authHeader));
    }

    /**
     * Mechanic withdrawal requests, optionally filtered by status
     * (PENDING / APPROVED / REJECTED / PAID).
     */
    @GetMapping("/wallet/withdrawals")
    public ResponseEntity<List<Map<String, Object>>> withdrawals(
            @RequestParam(required = false) String status,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.getWithdrawals(authHeader, status));
    }

    /**
     * Approves a PENDING withdrawal — debits the mechanic wallet and records
     * the WITHDRAWAL ledger entry.
     */
    @PostMapping("/wallet/withdrawals/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveWithdrawal(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.approveWithdrawal(id, authHeader));
    }

    @PostMapping("/wallet/withdrawals/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectWithdrawal(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.rejectWithdrawal(id, authHeader));
    }

    /**
     * Reverses the wallet credits of a paid booking (idempotent).
     */
    @PostMapping("/wallet/bookings/{bookingId}/refund")
    public ResponseEntity<Map<String, Object>> refundBooking(
            @PathVariable Long bookingId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(adminDashboardService.refundBooking(bookingId, authHeader));
    }
}
