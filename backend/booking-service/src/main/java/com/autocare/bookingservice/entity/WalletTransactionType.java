package com.autocare.bookingservice.entity;

/** Direction of a wallet movement. */
public enum WalletTransactionType {
    /** Money added to the wallet (commission / mechanic earning). */
    CREDIT,
    /** Money removed from the wallet (general debit, not a withdrawal/refund). */
    DEBIT,
    /** Money paid out to the mechanic after admin approval of a withdrawal. */
    WITHDRAWAL,
    /** Money returned to the customer — reverses the original credits. */
    REFUND
}
