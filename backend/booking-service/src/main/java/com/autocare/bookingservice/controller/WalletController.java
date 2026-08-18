package com.autocare.bookingservice.controller;

import com.autocare.bookingservice.client.MechanicServiceClient;
import com.autocare.bookingservice.dto.AdminWalletResponse;
import com.autocare.bookingservice.dto.MechanicWalletResponse;
import com.autocare.bookingservice.dto.WalletTransactionResponse;
import com.autocare.bookingservice.dto.WithdrawalRequestCreate;
import com.autocare.bookingservice.dto.WithdrawalRequestResponse;
import com.autocare.bookingservice.entity.WithdrawalStatus;
import com.autocare.bookingservice.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Wallet endpoints.
 *
 * <ul>
 *   <li>{@code /api/wallet/admin/**} — ADMIN only. Platform wallet summary,
 *       ledger, withdrawal management and booking refunds.</li>
 *   <li>{@code /api/wallet/mechanic/**} — MECHANIC only. The mechanic's own
 *       wallet, ledger and withdrawal requests. The mechanic profile is always
 *       resolved from the JWT subject — never from the request body.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;
    private final MechanicServiceClient mechanicServiceClient;

    public WalletController(WalletService walletService,
                            MechanicServiceClient mechanicServiceClient) {
        this.walletService = walletService;
        this.mechanicServiceClient = mechanicServiceClient;
    }

    // ─── Admin wallet ──────────────────────────────────────────────────────

    @GetMapping("/admin")
    public ResponseEntity<AdminWalletResponse> adminWallet() {
        return ResponseEntity.ok(walletService.getAdminWallet());
    }

    @GetMapping("/admin/transactions")
    public ResponseEntity<List<WalletTransactionResponse>> adminTransactions() {
        return ResponseEntity.ok(walletService.getAdminTransactions());
    }

    @GetMapping("/admin/withdrawals")
    public ResponseEntity<List<WithdrawalRequestResponse>> withdrawals(
            @RequestParam(required = false) String status) {
        WithdrawalStatus filter = null;
        if (status != null && !status.isBlank()) {
            try {
                filter = WithdrawalStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException(
                        "Invalid withdrawal status: " + status
                                + " (expected PENDING, APPROVED, REJECTED or PAID)");
            }
        }
        return ResponseEntity.ok(walletService.getWithdrawals(filter));
    }

    @PostMapping("/admin/withdrawals/{id}/approve")
    public ResponseEntity<WithdrawalRequestResponse> approveWithdrawal(
            @PathVariable Long id, Authentication authentication) {
        Long adminUserId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(walletService.approveWithdrawal(id, adminUserId));
    }

    @PostMapping("/admin/withdrawals/{id}/reject")
    public ResponseEntity<WithdrawalRequestResponse> rejectWithdrawal(
            @PathVariable Long id, Authentication authentication) {
        Long adminUserId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(walletService.rejectWithdrawal(id, adminUserId));
    }

    @PostMapping("/admin/bookings/{bookingId}/refund")
    public ResponseEntity<Map<String, Object>> refundBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(walletService.refundBooking(bookingId));
    }

    // ─── Mechanic wallet ───────────────────────────────────────────────────

    @GetMapping("/mechanic")
    public ResponseEntity<MechanicWalletResponse> mechanicWallet(Authentication authentication) {
        Long mechanicId = resolveMechanicId(authentication);
        return ResponseEntity.ok(walletService.getMechanicWallet(mechanicId));
    }

    @GetMapping("/mechanic/transactions")
    public ResponseEntity<List<WalletTransactionResponse>> mechanicTransactions(
            Authentication authentication) {
        Long mechanicId = resolveMechanicId(authentication);
        return ResponseEntity.ok(walletService.getMechanicTransactions(mechanicId));
    }

    @GetMapping("/mechanic/withdrawals")
    public ResponseEntity<List<WithdrawalRequestResponse>> mechanicWithdrawals(
            Authentication authentication) {
        Long mechanicId = resolveMechanicId(authentication);
        return ResponseEntity.ok(walletService.getMechanicWithdrawals(mechanicId));
    }

    @PostMapping("/mechanic/withdrawals")
    public ResponseEntity<WithdrawalRequestResponse> requestWithdrawal(
            @Valid @RequestBody WithdrawalRequestCreate request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        Long mechanicId = resolveMechanicId(authentication);
        // The mechanic's user account id is captured so they can be notified
        // of the admin's decision later — no lookup needed at processing time.
        WithdrawalRequestResponse response =
                walletService.requestWithdrawal(mechanicId, userId, request.getAmount());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Resolves the mechanic profile id from the JWT subject. A mechanic
     * account without a linked profile cannot use the wallet.
     */
    private Long resolveMechanicId(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        Long mechanicId = mechanicServiceClient.getMechanicIdByUserId(userId);
        if (mechanicId == null) {
            throw new IllegalArgumentException(
                    "No mechanic profile is linked to this account");
        }
        return mechanicId;
    }
}
