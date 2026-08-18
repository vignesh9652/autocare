package com.autocare.bookingservice.dto;

import java.math.BigDecimal;

/**
 * Published on the {@code wallet.mechanic-credited} routing key right after a
 * mechanic's wallet is credited for a paid booking. notification-service uses
 * it to tell the mechanic their earning has landed.
 */
public class MechanicWalletCreditedEvent {

    private Long mechanicId;
    /** Mechanic's user account id — the notification target (may be null). */
    private Long mechanicUserId;
    private Long bookingId;
    private Long paymentId;
    /** Earning credited to the wallet. */
    private BigDecimal amount;
    /** Wallet balance immediately after the credit. */
    private BigDecimal balance;

    public MechanicWalletCreditedEvent() {
    }

    public MechanicWalletCreditedEvent(Long mechanicId, Long mechanicUserId,
                                       Long bookingId, Long paymentId,
                                       BigDecimal amount, BigDecimal balance) {
        this.mechanicId = mechanicId;
        this.mechanicUserId = mechanicUserId;
        this.bookingId = bookingId;
        this.paymentId = paymentId;
        this.amount = amount;
        this.balance = balance;
    }

    public Long getMechanicId() {
        return mechanicId;
    }

    public void setMechanicId(Long mechanicId) {
        this.mechanicId = mechanicId;
    }

    public Long getMechanicUserId() {
        return mechanicUserId;
    }

    public void setMechanicUserId(Long mechanicUserId) {
        this.mechanicUserId = mechanicUserId;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Long paymentId) {
        this.paymentId = paymentId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }
}
