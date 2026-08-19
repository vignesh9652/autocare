package com.autocare.userservice.entity;

/**
 * Account lifecycle status.
 *
 * <ul>
 *   <li>{@code APPROVED} — the account may log in (CUSTOMER and ADMIN are
 *       created with this status immediately).</li>
 *   <li>{@code PENDING} — mechanic accounts awaiting admin review. Login is
 *       blocked until an admin approves them.</li>
 *   <li>{@code REJECTED} — a mechanic registration the admin declined. Login
 *       stays blocked.</li>
 * </ul>
 */
public enum AccountStatus {
    PENDING,
    APPROVED,
    REJECTED
}
