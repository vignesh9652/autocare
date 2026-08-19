package com.autocare.bookingservice.service;

import com.autocare.bookingservice.config.RabbitMQConfig;
import com.autocare.bookingservice.dto.AdminWalletResponse;
import com.autocare.bookingservice.dto.MechanicWalletCreditedEvent;
import com.autocare.bookingservice.dto.MechanicWalletResponse;
import com.autocare.bookingservice.dto.WalletTransactionResponse;
import com.autocare.bookingservice.dto.WithdrawalRequestProcessedEvent;
import com.autocare.bookingservice.dto.WithdrawalRequestResponse;
import com.autocare.bookingservice.entity.*;
import com.autocare.bookingservice.exception.WithdrawalRequestNotFoundException;
import com.autocare.bookingservice.repository.AdminWalletRepository;
import com.autocare.bookingservice.repository.MechanicWalletRepository;
import com.autocare.bookingservice.repository.WalletTransactionRepository;
import com.autocare.bookingservice.repository.WithdrawalRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Wallet & money-distribution ledger. Crediting always happens inside the same
 * transaction that marks a booking PAID ({@link BookingService#markPaid}), so
 * the admin credit, mechanic credit and their ledger entries are atomic — a
 * failure rolls everything back including the booking status change.
 *
 * <p>All amounts come from the booking's server-side final amount and the
 * already-computed commission/earning split — nothing is ever accepted from
 * the client. Both the booking-status guard in {@code markPaid} and the
 * {@code uk_wtx_source} unique constraint make credits idempotent, so a
 * duplicate payment callback can never double-credit a wallet.</p>
 */
@Service
public class WalletService {

    private static final Logger log = LoggerFactory.getLogger(WalletService.class);

    private final AdminWalletRepository adminWalletRepository;
    private final MechanicWalletRepository mechanicWalletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final RabbitTemplate rabbitTemplate;

    public WalletService(AdminWalletRepository adminWalletRepository,
                         MechanicWalletRepository mechanicWalletRepository,
                         WalletTransactionRepository transactionRepository,
                         WithdrawalRequestRepository withdrawalRequestRepository,
                         RabbitTemplate rabbitTemplate) {
        this.adminWalletRepository = adminWalletRepository;
        this.mechanicWalletRepository = mechanicWalletRepository;
        this.transactionRepository = transactionRepository;
        this.withdrawalRequestRepository = withdrawalRequestRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    // ─── Crediting (payment success) ────────────────────────────────────────

    /**
     * Credits the admin wallet with the platform commission and the mechanic
     * wallet with the mechanic earning for a paid booking. Called by
     * {@link BookingService#markPaid} inside the same transaction.
     *
     * <p>Idempotent: when an ADMIN credit already exists for the booking (and
     * payment) this is a no-op, so a duplicate payment callback cannot credit
     * the wallets twice.</p>
     */
    @Transactional
    public void creditPaidBooking(Booking booking, Long paymentId) {
        BigDecimal commission = booking.getPlatformCommission();
        BigDecimal earning = booking.getMechanicEarning();
        if (commission == null || earning == null || booking.getMechanicId() == null) {
            log.warn("⚠️ [WALLET] Booking #{} paid without a commission/earning split — skipping credits",
                    booking.getId());
            return;
        }

        boolean alreadyCredited = paymentId != null
                && transactionRepository.existsByWalletTypeAndBookingIdAndPaymentIdAndTransactionType(
                        WalletType.ADMIN, booking.getId(), paymentId, WalletTransactionType.CREDIT);
        if (alreadyCredited) {
            log.info("🔄 [WALLET] Booking #{} already credited — skipping duplicate wallet credits",
                    booking.getId());
            return;
        }

        creditAdminWallet(booking.getId(), paymentId, commission);
        creditMechanicWallet(booking.getMechanicId(), booking.getMechanicUserId(),
                booking.getId(), paymentId, earning);
        log.info("💰 [WALLET] Booking #{} paid: admin +{} commission, mechanic #{} +{} earning",
                booking.getId(), commission, booking.getMechanicId(), earning);
    }

    private void creditAdminWallet(Long bookingId, Long paymentId, BigDecimal amount) {
        AdminWallet wallet = getOrCreateAdminWallet();
        BigDecimal newBalance = wallet.getBalance().add(amount);
        wallet.setBalance(newBalance);
        wallet.setTotalCommission(wallet.getTotalCommission().add(amount));
        adminWalletRepository.save(wallet);

        transactionRepository.save(new WalletTransaction(
                WalletType.ADMIN, wallet.getId(), null, bookingId, paymentId,
                WalletTransactionType.CREDIT, amount, newBalance,
                "AutoCare platform commission"));
    }

    private void creditMechanicWallet(Long mechanicId, Long mechanicUserId, Long bookingId,
                                      Long paymentId, BigDecimal amount) {
        MechanicWallet wallet = getOrCreateMechanicWallet(mechanicId);
        BigDecimal newBalance = wallet.getBalance().add(amount);
        wallet.setBalance(newBalance);
        wallet.setTotalEarnings(wallet.getTotalEarnings().add(amount));
        mechanicWalletRepository.save(wallet);

        transactionRepository.save(new WalletTransaction(
                WalletType.MECHANIC, wallet.getId(), mechanicId, bookingId, paymentId,
                WalletTransactionType.CREDIT, amount, newBalance,
                "Mechanic earning for booking"));

        // Notify the mechanic's account that their earning has landed.
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_WALLET_MECHANIC_CREDITED,
                new MechanicWalletCreditedEvent(
                        mechanicId, mechanicUserId, bookingId, paymentId, amount, newBalance));
    }

    // ─── Queries ────────────────────────────────────────────────────────────

    @Transactional
    public AdminWalletResponse getAdminWallet() {
        AdminWallet wallet = getOrCreateAdminWallet();
        return new AdminWalletResponse(
                wallet.getBalance(), wallet.getTotalCommission(), wallet.getTotalWithdrawn());
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> getAdminTransactions() {
        return transactionRepository.findByWalletTypeOrderByCreatedAtDesc(WalletType.ADMIN)
                .stream()
                .map(WalletTransactionResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public MechanicWalletResponse getMechanicWallet(Long mechanicId) {
        MechanicWallet wallet = getOrCreateMechanicWallet(mechanicId);
        return new MechanicWalletResponse(
                wallet.getMechanicId(),
                wallet.getBalance(),
                wallet.getTotalEarnings(),
                wallet.getTotalWithdrawn());
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionResponse> getMechanicTransactions(Long mechanicId) {
        return transactionRepository.findByMechanicIdOrderByCreatedAtDesc(mechanicId)
                .stream()
                .map(WalletTransactionResponse::from)
                .collect(Collectors.toList());
    }

    // ─── Withdrawals ────────────────────────────────────────────────────────

    /**
     * Creates a PENDING withdrawal request. Validates that the amount is
     * positive and does not exceed the mechanic's available balance. The
     * balance is only debited when the admin approves.
     */
    @Transactional
    public WithdrawalRequestResponse requestWithdrawal(Long mechanicId, Long mechanicUserId,
                                                      BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be greater than zero");
        }
        MechanicWallet wallet = getOrCreateMechanicWallet(mechanicId);
        if (amount.compareTo(wallet.getBalance()) > 0) {
            throw new IllegalArgumentException(
                    "Insufficient balance — available: ₹" + wallet.getBalance().toPlainString());
        }
        WithdrawalRequest request = withdrawalRequestRepository.save(
                new WithdrawalRequest(mechanicId, mechanicUserId, wallet.getId(), amount));
        log.info("🏧 [WALLET] Mechanic #{} requested withdrawal of ₹{} (request #{})",
                mechanicId, amount, request.getId());
        return WithdrawalRequestResponse.from(request);
    }

    @Transactional(readOnly = true)
    public List<WithdrawalRequestResponse> getMechanicWithdrawals(Long mechanicId) {
        return withdrawalRequestRepository.findByMechanicIdOrderByRequestedAtDesc(mechanicId)
                .stream()
                .map(WithdrawalRequestResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<WithdrawalRequestResponse> getWithdrawals(WithdrawalStatus status) {
        List<WithdrawalRequest> requests = status != null
                ? withdrawalRequestRepository.findByStatusOrderByRequestedAtDesc(status)
                : withdrawalRequestRepository.findAllByOrderByRequestedAtDesc();
        return requests.stream()
                .map(WithdrawalRequestResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * Approves a PENDING withdrawal: debits the mechanic's wallet, records the
     * WITHDRAWAL ledger entry and marks the request APPROVED. The balance is
     * re-checked — if it dropped below the requested amount the request is
     * auto-rejected instead of overdrawing the wallet.
     */
    @Transactional
    public WithdrawalRequestResponse approveWithdrawal(Long withdrawalId, Long adminUserId) {
        WithdrawalRequest request = findPending(withdrawalId);

        MechanicWallet wallet = mechanicWalletRepository.findById(request.getWalletId())
                .orElseThrow(() -> new IllegalStateException(
                        "Wallet missing for withdrawal request #" + withdrawalId));

        if (request.getAmount().compareTo(wallet.getBalance()) > 0) {
            log.warn("⚠️ [WALLET] Withdrawal #{} (₹{}) exceeds balance ₹{} — auto-rejecting",
                    withdrawalId, request.getAmount(), wallet.getBalance());
            request.setStatus(WithdrawalStatus.REJECTED);
            request.setProcessedAt(LocalDateTime.now());
            request.setProcessedBy(adminUserId);
            withdrawalRequestRepository.save(request);
            publishProcessed(request, WithdrawalStatus.REJECTED, wallet.getBalance());
            return WithdrawalRequestResponse.from(request);
        }

        BigDecimal newBalance = wallet.getBalance().subtract(request.getAmount());
        wallet.setBalance(newBalance);
        wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(request.getAmount()));
        mechanicWalletRepository.save(wallet);

        transactionRepository.save(new WalletTransaction(
                WalletType.MECHANIC, wallet.getId(), request.getMechanicId(), null, null,
                WalletTransactionType.WITHDRAWAL, request.getAmount(), newBalance,
                "Withdrawal payout to mechanic"));

        request.setStatus(WithdrawalStatus.APPROVED);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(adminUserId);
        withdrawalRequestRepository.save(request);
        publishProcessed(request, WithdrawalStatus.APPROVED, newBalance);
        log.info("🏧 [WALLET] Withdrawal #{} approved: mechanic #{} paid ₹{}",
                withdrawalId, request.getMechanicId(), request.getAmount());
        return WithdrawalRequestResponse.from(request);
    }

    @Transactional
    public WithdrawalRequestResponse rejectWithdrawal(Long withdrawalId, Long adminUserId) {
        WithdrawalRequest request = findPending(withdrawalId);
        request.setStatus(WithdrawalStatus.REJECTED);
        request.setProcessedAt(LocalDateTime.now());
        request.setProcessedBy(adminUserId);
        withdrawalRequestRepository.save(request);

        // Include the current balance so the mechanic sees what is still available.
        BigDecimal balance = mechanicWalletRepository.findById(request.getWalletId())
                .map(MechanicWallet::getBalance)
                .orElse(BigDecimal.ZERO);
        publishProcessed(request, WithdrawalStatus.REJECTED, balance);
        return WithdrawalRequestResponse.from(request);
    }

    /** Tells the mechanic's account how their withdrawal request was resolved. */
    private void publishProcessed(WithdrawalRequest request, WithdrawalStatus status,
                                  BigDecimal balance) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_WITHDRAWAL_PROCESSED,
                new WithdrawalRequestProcessedEvent(
                        request.getId(),
                        request.getMechanicId(),
                        request.getMechanicUserId(),
                        request.getAmount(),
                        status.name(),
                        balance,
                        request.getProcessedAt()));
    }

    private WithdrawalRequest findPending(Long withdrawalId) {
        WithdrawalRequest request = withdrawalRequestRepository.findById(withdrawalId)
                .orElseThrow(() -> new WithdrawalRequestNotFoundException(
                        "Withdrawal request not found with id: " + withdrawalId));
        if (request.getStatus() != WithdrawalStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Only PENDING withdrawal requests can be processed (current status: "
                            + request.getStatus() + ")");
        }
        return request;
    }

    // ─── Refunds ────────────────────────────────────────────────────────────

    /**
     * Reverses the admin-commission and mechanic-earning credits of a paid
     * booking by writing REFUND ledger entries and debiting both wallets.
     * Idempotent: a second call for the same booking is a no-op.
     *
     * <p>Note: reversing the customer's payment itself (Razorpay refund) is
     * the payment gateway's job — this method keeps the platform ledger
     * consistent once that refund has happened.</p>
     */
    @Transactional
    public Map<String, Object> refundBooking(Long bookingId) {
        if (transactionRepository.existsByWalletTypeAndBookingIdAndTransactionType(
                WalletType.ADMIN, bookingId, WalletTransactionType.REFUND)) {
            log.info("🔄 [WALLET] Booking #{} already refunded — skipping duplicate refund", bookingId);
            return Map.of("status", "already_refunded", "bookingId", bookingId);
        }

        List<WalletTransaction> adminCredits = transactionRepository
                .findByWalletTypeAndBookingIdAndTransactionType(
                        WalletType.ADMIN, bookingId, WalletTransactionType.CREDIT);
        if (adminCredits.isEmpty()) {
            throw new IllegalArgumentException(
                    "No payment recorded for booking #" + bookingId + " — cannot refund");
        }

        BigDecimal commission = sum(adminCredits);
        Long paymentId = adminCredits.get(0).getPaymentId();

        // Reverse the admin wallet (commission)
        AdminWallet adminWallet = getOrCreateAdminWallet();
        BigDecimal adminBalance = adminWallet.getBalance().subtract(commission);
        adminWallet.setBalance(adminBalance);
        adminWallet.setTotalCommission(adminWallet.getTotalCommission().subtract(commission));
        adminWalletRepository.save(adminWallet);
        transactionRepository.save(new WalletTransaction(
                WalletType.ADMIN, adminWallet.getId(), null, bookingId, paymentId,
                WalletTransactionType.REFUND, commission, adminBalance,
                "Refund — platform commission reversed"));

        // Reverse the mechanic wallet (earning)
        List<WalletTransaction> mechanicCredits = transactionRepository
                .findByWalletTypeAndBookingIdAndTransactionType(
                        WalletType.MECHANIC, bookingId, WalletTransactionType.CREDIT);
        BigDecimal earning = sum(mechanicCredits);
        Long mechanicId = mechanicCredits.isEmpty() ? null : mechanicCredits.get(0).getMechanicId();
        if (mechanicId != null) {
            MechanicWallet mechanicWallet = getOrCreateMechanicWallet(mechanicId);
            BigDecimal mechanicBalance = mechanicWallet.getBalance().subtract(earning);
            mechanicWallet.setBalance(mechanicBalance);
            mechanicWallet.setTotalEarnings(mechanicWallet.getTotalEarnings().subtract(earning));
            mechanicWalletRepository.save(mechanicWallet);
            transactionRepository.save(new WalletTransaction(
                    WalletType.MECHANIC, mechanicWallet.getId(), mechanicId, bookingId, paymentId,
                    WalletTransactionType.REFUND, earning, mechanicBalance,
                    "Refund — mechanic earning reversed"));
        }

        log.info("↩️ [WALLET] Booking #{} refunded: admin −{} commission, mechanic −{} earning",
                bookingId, commission, earning);
        return Map.of(
                "status", "refunded",
                "bookingId", bookingId,
                "platformCommission", commission,
                "mechanicEarning", earning);
    }

    // ─── Wallet accessors (single admin wallet / one wallet per mechanic) ───

    @Transactional
    public AdminWallet getOrCreateAdminWallet() {
        return adminWalletRepository.findAll().stream().findFirst()
                .orElseGet(() -> adminWalletRepository.save(new AdminWallet()));
    }

    @Transactional
    public MechanicWallet getOrCreateMechanicWallet(Long mechanicId) {
        return mechanicWalletRepository.findByMechanicId(mechanicId)
                .orElseGet(() -> mechanicWalletRepository.save(new MechanicWallet(mechanicId)));
    }

    private BigDecimal sum(List<WalletTransaction> transactions) {
        return transactions.stream()
                .map(WalletTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
