package com.autocare.bookingservice.entity;

/**
 * Lifecycle of a mechanic withdrawal request. In this version the money is
 * only ever moved within the platform ledger — no actual bank payout is
 * attempted, so a request is either approved (money reserved + ledgered as a
 * WITHDRAWAL) or rejected. {@code PAID} is reserved for a future real payout
 * integration.
 */
public enum WithdrawalStatus {
    PENDING,
    APPROVED,
    REJECTED,
    PAID
}
