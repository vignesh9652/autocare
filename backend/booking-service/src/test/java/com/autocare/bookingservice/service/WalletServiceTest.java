package com.autocare.bookingservice.service;

import com.autocare.bookingservice.config.RabbitMQConfig;
import com.autocare.bookingservice.dto.AdminWalletResponse;
import com.autocare.bookingservice.dto.MechanicWalletCreditedEvent;
import com.autocare.bookingservice.dto.MechanicWalletResponse;
import com.autocare.bookingservice.dto.WithdrawalRequestProcessedEvent;
import com.autocare.bookingservice.dto.WithdrawalRequestResponse;
import com.autocare.bookingservice.entity.*;
import com.autocare.bookingservice.exception.WithdrawalRequestNotFoundException;
import com.autocare.bookingservice.repository.AdminWalletRepository;
import com.autocare.bookingservice.repository.MechanicWalletRepository;
import com.autocare.bookingservice.repository.WalletTransactionRepository;
import com.autocare.bookingservice.repository.WithdrawalRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private AdminWalletRepository adminWalletRepository;

    @Mock
    private MechanicWalletRepository mechanicWalletRepository;

    @Mock
    private WalletTransactionRepository transactionRepository;

    @Mock
    private WithdrawalRequestRepository withdrawalRequestRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    private WalletService walletService;

    private final Long bookingId = 100L;
    private final Long paymentId = 777L;
    private final Long mechanicId = 20L;

    @BeforeEach
    void setUp() {
        walletService = new WalletService(adminWalletRepository, mechanicWalletRepository,
                transactionRepository, withdrawalRequestRepository, rabbitTemplate);
    }

    private static <T> T last(List<T> values) {
        return values.get(values.size() - 1);
    }

    private Booking paidBooking(BigDecimal commission, BigDecimal earning) {
        Booking booking = new Booking(1L, 10L, mechanicId, "Oil Change",
                LocalDateTime.of(2026, 8, 1, 10, 0), "123 Main St");
        booking.setId(bookingId);
        booking.setStatus(BookingStatus.PAID);
        booking.setMechanicUserId(3L);
        booking.setFinalAmount(commission.add(earning));
        booking.setPlatformCommission(commission);
        booking.setMechanicEarning(earning);
        return booking;
    }

    // ─── WALLET CREATION ─────────────────────────────────────────────────

    @Test
    void getOrCreateAdminWallet_WhenNoneExists_ShouldCreateOne() {
        when(adminWalletRepository.findAll()).thenReturn(List.of());
        when(adminWalletRepository.save(any(AdminWallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AdminWallet wallet = walletService.getOrCreateAdminWallet();

        assertNotNull(wallet);
        assertEquals(0, BigDecimal.ZERO.compareTo(wallet.getBalance()));
        assertEquals(0, BigDecimal.ZERO.compareTo(wallet.getTotalCommission()));
        verify(adminWalletRepository).save(any(AdminWallet.class));
    }

    @Test
    void getOrCreateAdminWallet_WhenExists_ShouldReuseIt() {
        AdminWallet existing = new AdminWallet();
        existing.setId(1L);
        existing.setBalance(new BigDecimal("1000.00"));
        when(adminWalletRepository.findAll()).thenReturn(List.of(existing));

        AdminWallet wallet = walletService.getOrCreateAdminWallet();

        assertEquals(1L, wallet.getId());
        verify(adminWalletRepository, never()).save(any());
    }

    @Test
    void getOrCreateMechanicWallet_WhenNoneExists_ShouldCreateOne() {
        when(mechanicWalletRepository.findByMechanicId(mechanicId)).thenReturn(Optional.empty());
        when(mechanicWalletRepository.save(any(MechanicWallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        MechanicWallet wallet = walletService.getOrCreateMechanicWallet(mechanicId);

        assertNotNull(wallet);
        assertEquals(mechanicId, wallet.getMechanicId());
        verify(mechanicWalletRepository).save(any(MechanicWallet.class));
    }

    @Test
    void getOrCreateMechanicWallet_WhenExists_ShouldReuseTheSingleWallet() {
        MechanicWallet existing = new MechanicWallet(mechanicId);
        existing.setId(5L);
        existing.setBalance(new BigDecimal("8500.00"));
        when(mechanicWalletRepository.findByMechanicId(mechanicId)).thenReturn(Optional.of(existing));

        MechanicWallet first = walletService.getOrCreateMechanicWallet(mechanicId);
        MechanicWallet second = walletService.getOrCreateMechanicWallet(mechanicId);

        assertEquals(existing, first);
        assertEquals(existing, second);
        // One wallet per mechanic — never a second save for the same mechanic
        verify(mechanicWalletRepository, never()).save(any());
    }

    // ─── PAYMENT SUCCESS CREDITS ─────────────────────────────────────────

    @Test
    void creditPaidBooking_ShouldCreditAdminAndMechanicWalletsAndLedger() {
        Booking booking = paidBooking(new BigDecimal("150.00"), new BigDecimal("850.00"));
        when(transactionRepository.existsByWalletTypeAndBookingIdAndPaymentIdAndTransactionType(
                WalletType.ADMIN, bookingId, paymentId, WalletTransactionType.CREDIT)).thenReturn(false);
        when(adminWalletRepository.findAll()).thenReturn(List.of());
        when(adminWalletRepository.save(any(AdminWallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(mechanicWalletRepository.findByMechanicId(mechanicId)).thenReturn(Optional.empty());
        when(mechanicWalletRepository.save(any(MechanicWallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(WalletTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        walletService.creditPaidBooking(booking, paymentId);

        // The admin wallet is created lazily (save #1) and then credited (save #2).
        ArgumentCaptor<AdminWallet> adminCaptor = ArgumentCaptor.forClass(AdminWallet.class);
        verify(adminWalletRepository, times(2)).save(adminCaptor.capture());
        AdminWallet savedAdmin = last(adminCaptor.getAllValues());
        assertEquals(0, new BigDecimal("150.00").compareTo(savedAdmin.getBalance()));
        assertEquals(0, new BigDecimal("150.00").compareTo(savedAdmin.getTotalCommission()));

        ArgumentCaptor<MechanicWallet> mechanicCaptor = ArgumentCaptor.forClass(MechanicWallet.class);
        verify(mechanicWalletRepository, times(2)).save(mechanicCaptor.capture());
        MechanicWallet savedMechanic = last(mechanicCaptor.getAllValues());
        assertEquals(0, new BigDecimal("850.00").compareTo(savedMechanic.getBalance()));
        assertEquals(0, new BigDecimal("850.00").compareTo(savedMechanic.getTotalEarnings()));

        ArgumentCaptor<WalletTransaction> txnCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(transactionRepository, times(2)).save(txnCaptor.capture());
        List<WalletTransaction> txns = txnCaptor.getAllValues();
        assertEquals(WalletType.ADMIN, txns.get(0).getWalletType());
        assertEquals(WalletTransactionType.CREDIT, txns.get(0).getTransactionType());
        assertEquals(0, new BigDecimal("150.00").compareTo(txns.get(0).getAmount()));
        assertEquals(0, new BigDecimal("150.00").compareTo(txns.get(0).getBalanceAfterTransaction()));
        assertEquals(bookingId, txns.get(0).getBookingId());
        assertEquals(paymentId, txns.get(0).getPaymentId());
        assertEquals(WalletType.MECHANIC, txns.get(1).getWalletType());
        assertEquals(mechanicId, txns.get(1).getMechanicId());
        assertEquals(0, new BigDecimal("850.00").compareTo(txns.get(1).getAmount()));

        // The mechanic is notified via RabbitMQ with the credit + new balance
        ArgumentCaptor<MechanicWalletCreditedEvent> eventCaptor =
                ArgumentCaptor.forClass(MechanicWalletCreditedEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_WALLET_MECHANIC_CREDITED),
                eventCaptor.capture());
        MechanicWalletCreditedEvent event = eventCaptor.getValue();
        assertEquals(mechanicId, event.getMechanicId());
        assertEquals(3L, event.getMechanicUserId());
        assertEquals(bookingId, event.getBookingId());
        assertEquals(paymentId, event.getPaymentId());
        assertEquals(0, new BigDecimal("850.00").compareTo(event.getAmount()));
        assertEquals(0, new BigDecimal("850.00").compareTo(event.getBalance()));
    }

    @Test
    void creditPaidBooking_DuplicatePayment_ShouldNotCreditTwice() {
        Booking booking = paidBooking(new BigDecimal("150.00"), new BigDecimal("850.00"));
        // An ADMIN credit already exists for this booking+payment → idempotent skip
        when(transactionRepository.existsByWalletTypeAndBookingIdAndPaymentIdAndTransactionType(
                WalletType.ADMIN, bookingId, paymentId, WalletTransactionType.CREDIT)).thenReturn(true);

        walletService.creditPaidBooking(booking, paymentId);

        verify(adminWalletRepository, never()).save(any());
        verify(mechanicWalletRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
        // No duplicate notification for a re-delivered payment callback
        verify(rabbitTemplate, never()).convertAndSend(anyString(), anyString(), any(Object.class));
    }

    @Test
    void creditPaidBooking_WithoutSplit_ShouldSkip() {
        Booking booking = paidBooking(new BigDecimal("150.00"), new BigDecimal("850.00"));
        booking.setPlatformCommission(null); // e.g. event out of order / missing split

        walletService.creditPaidBooking(booking, paymentId);

        verify(adminWalletRepository, never()).save(any());
        verify(mechanicWalletRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void creditPaidBooking_AccumulatesAcrossBookings() {
        when(transactionRepository.existsByWalletTypeAndBookingIdAndPaymentIdAndTransactionType(
                eq(WalletType.ADMIN), anyLong(), anyLong(), eq(WalletTransactionType.CREDIT))).thenReturn(false);
        AdminWallet adminWallet = new AdminWallet();
        adminWallet.setId(1L);
        adminWallet.setBalance(new BigDecimal("1000.00"));
        adminWallet.setTotalCommission(new BigDecimal("1000.00"));
        when(adminWalletRepository.findAll()).thenReturn(List.of(adminWallet));
        when(adminWalletRepository.save(any(AdminWallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(mechanicWalletRepository.findByMechanicId(mechanicId)).thenReturn(Optional.empty());
        when(mechanicWalletRepository.save(any(MechanicWallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(WalletTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        walletService.creditPaidBooking(paidBooking(new BigDecimal("150.00"), new BigDecimal("850.00")), 1L);
        walletService.creditPaidBooking(paidBooking(new BigDecimal("195.00"), new BigDecimal("1105.00")), 2L);

        assertEquals(0, new BigDecimal("1345.00").compareTo(adminWallet.getBalance()));
        assertEquals(0, new BigDecimal("1345.00").compareTo(adminWallet.getTotalCommission()));
    }

    // ─── QUERIES ─────────────────────────────────────────────────────────

    @Test
    void getAdminWallet_ShouldReturnSummary() {
        AdminWallet adminWallet = new AdminWallet();
        adminWallet.setId(1L);
        adminWallet.setBalance(new BigDecimal("25500.00"));
        adminWallet.setTotalCommission(new BigDecimal("40000.00"));
        adminWallet.setTotalWithdrawn(new BigDecimal("14500.00"));
        when(adminWalletRepository.findAll()).thenReturn(List.of(adminWallet));

        AdminWalletResponse response = walletService.getAdminWallet();

        assertEquals(0, new BigDecimal("25500.00").compareTo(response.getBalance()));
        assertEquals(0, new BigDecimal("40000.00").compareTo(response.getTotalCommission()));
        assertEquals(0, new BigDecimal("14500.00").compareTo(response.getTotalWithdrawn()));
    }

    @Test
    void getMechanicWallet_ShouldReturnOnlyThatMechanicsWallet() {
        MechanicWallet mechanicWallet = new MechanicWallet(mechanicId);
        mechanicWallet.setId(5L);
        mechanicWallet.setBalance(new BigDecimal("8500.00"));
        mechanicWallet.setTotalEarnings(new BigDecimal("15000.00"));
        mechanicWallet.setTotalWithdrawn(new BigDecimal("6500.00"));
        when(mechanicWalletRepository.findByMechanicId(mechanicId)).thenReturn(Optional.of(mechanicWallet));

        MechanicWalletResponse response = walletService.getMechanicWallet(mechanicId);

        assertEquals(mechanicId, response.getMechanicId());
        assertEquals(0, new BigDecimal("8500.00").compareTo(response.getBalance()));
        assertEquals(0, new BigDecimal("15000.00").compareTo(response.getTotalEarnings()));
        assertEquals(0, new BigDecimal("6500.00").compareTo(response.getTotalWithdrawn()));
        // The query is scoped to the resolved mechanic id — no other mechanic's data
        verify(mechanicWalletRepository).findByMechanicId(mechanicId);
    }

    @Test
    void getMechanicTransactions_ShouldScopeToTheMechanicsId() {
        when(transactionRepository.findByMechanicIdOrderByCreatedAtDesc(mechanicId)).thenReturn(List.of());

        walletService.getMechanicTransactions(mechanicId);

        verify(transactionRepository).findByMechanicIdOrderByCreatedAtDesc(mechanicId);
    }

    // ─── REFUNDS ─────────────────────────────────────────────────────────

    @Test
    void refundBooking_ShouldReverseBothWalletsAndWriteRefundLedger() {
        AdminWallet adminWallet = new AdminWallet();
        adminWallet.setId(1L);
        adminWallet.setBalance(new BigDecimal("1500.00"));
        adminWallet.setTotalCommission(new BigDecimal("1500.00"));
        when(adminWalletRepository.findAll()).thenReturn(List.of(adminWallet));

        MechanicWallet mechanicWallet = new MechanicWallet(mechanicId);
        mechanicWallet.setId(5L);
        mechanicWallet.setBalance(new BigDecimal("8500.00"));
        mechanicWallet.setTotalEarnings(new BigDecimal("8500.00"));
        when(mechanicWalletRepository.findByMechanicId(mechanicId)).thenReturn(Optional.of(mechanicWallet));

        WalletTransaction adminCredit = new WalletTransaction(
                WalletType.ADMIN, 1L, null, bookingId, paymentId,
                WalletTransactionType.CREDIT, new BigDecimal("150.00"), new BigDecimal("150.00"),
                "AutoCare platform commission");
        WalletTransaction mechanicCredit = new WalletTransaction(
                WalletType.MECHANIC, 5L, mechanicId, bookingId, paymentId,
                WalletTransactionType.CREDIT, new BigDecimal("850.00"), new BigDecimal("850.00"),
                "Mechanic earning for booking");

        when(transactionRepository.existsByWalletTypeAndBookingIdAndTransactionType(
                WalletType.ADMIN, bookingId, WalletTransactionType.REFUND)).thenReturn(false);
        when(transactionRepository.findByWalletTypeAndBookingIdAndTransactionType(
                WalletType.ADMIN, bookingId, WalletTransactionType.CREDIT)).thenReturn(List.of(adminCredit));
        when(transactionRepository.findByWalletTypeAndBookingIdAndTransactionType(
                WalletType.MECHANIC, bookingId, WalletTransactionType.CREDIT)).thenReturn(List.of(mechanicCredit));
        when(adminWalletRepository.save(any(AdminWallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(mechanicWalletRepository.save(any(MechanicWallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(WalletTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = walletService.refundBooking(bookingId);

        assertEquals("refunded", result.get("status"));
        // Admin wallet: 1500 − 150 commission
        assertEquals(0, new BigDecimal("1350.00").compareTo(adminWallet.getBalance()));
        assertEquals(0, new BigDecimal("1350.00").compareTo(adminWallet.getTotalCommission()));
        // Mechanic wallet: 8500 − 850 earning
        assertEquals(0, new BigDecimal("7650.00").compareTo(mechanicWallet.getBalance()));
        assertEquals(0, new BigDecimal("7650.00").compareTo(mechanicWallet.getTotalEarnings()));

        ArgumentCaptor<WalletTransaction> txnCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(transactionRepository, times(2)).save(txnCaptor.capture());
        List<WalletTransaction> refunds = txnCaptor.getAllValues();
        assertTrue(refunds.stream().allMatch(t -> t.getTransactionType() == WalletTransactionType.REFUND));
        assertEquals(0, new BigDecimal("150.00").compareTo(refunds.get(0).getAmount()));
        assertEquals(0, new BigDecimal("850.00").compareTo(refunds.get(1).getAmount()));
    }

    @Test
    void refundBooking_DuplicateRefund_ShouldBeIdempotent() {
        when(transactionRepository.existsByWalletTypeAndBookingIdAndTransactionType(
                WalletType.ADMIN, bookingId, WalletTransactionType.REFUND)).thenReturn(true);

        Map<String, Object> result = walletService.refundBooking(bookingId);

        assertEquals("already_refunded", result.get("status"));
        verify(adminWalletRepository, never()).save(any());
        verify(mechanicWalletRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void refundBooking_WithoutPayment_ShouldThrow() {
        when(transactionRepository.existsByWalletTypeAndBookingIdAndTransactionType(
                WalletType.ADMIN, bookingId, WalletTransactionType.REFUND)).thenReturn(false);
        when(transactionRepository.findByWalletTypeAndBookingIdAndTransactionType(
                WalletType.ADMIN, bookingId, WalletTransactionType.CREDIT)).thenReturn(List.of());

        assertThrows(IllegalArgumentException.class, () -> walletService.refundBooking(bookingId));
    }

    // ─── WITHDRAWALS ─────────────────────────────────────────────────────

    @Test
    void requestWithdrawal_ShouldCreatePendingRequest() {
        MechanicWallet wallet = new MechanicWallet(mechanicId);
        wallet.setId(5L);
        wallet.setBalance(new BigDecimal("8500.00"));
        when(mechanicWalletRepository.findByMechanicId(mechanicId)).thenReturn(Optional.of(wallet));
        when(withdrawalRequestRepository.save(any(WithdrawalRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WithdrawalRequestResponse response = walletService.requestWithdrawal(
                mechanicId, 3L, new BigDecimal("5000.00"));

        assertEquals(WithdrawalStatus.PENDING, response.getStatus());
        assertEquals(0, new BigDecimal("5000.00").compareTo(response.getAmount()));
        assertEquals(mechanicId, response.getMechanicId());

        ArgumentCaptor<WithdrawalRequest> captor = ArgumentCaptor.forClass(WithdrawalRequest.class);
        verify(withdrawalRequestRepository).save(captor.capture());
        assertEquals(wallet.getId(), captor.getValue().getWalletId());
        // The mechanic's user account is captured so they can be notified later
        assertEquals(3L, captor.getValue().getMechanicUserId());
    }

    @Test
    void requestWithdrawal_ZeroOrNegative_ShouldThrow() {
        assertThrows(IllegalArgumentException.class,
                () -> walletService.requestWithdrawal(mechanicId, 3L, BigDecimal.ZERO));
        assertThrows(IllegalArgumentException.class,
                () -> walletService.requestWithdrawal(mechanicId, 3L, new BigDecimal("-5.00")));
        verify(withdrawalRequestRepository, never()).save(any());
    }

    @Test
    void requestWithdrawal_OverBalance_ShouldThrow() {
        MechanicWallet wallet = new MechanicWallet(mechanicId);
        wallet.setBalance(new BigDecimal("1000.00"));
        when(mechanicWalletRepository.findByMechanicId(mechanicId)).thenReturn(Optional.of(wallet));

        assertThrows(IllegalArgumentException.class,
                () -> walletService.requestWithdrawal(mechanicId, 3L, new BigDecimal("1000.01")));
        verify(withdrawalRequestRepository, never()).save(any());
    }

    @Test
    void approveWithdrawal_ShouldDebitWalletAndLedgerWithdrawal() {
        MechanicWallet wallet = new MechanicWallet(mechanicId);
        wallet.setId(5L);
        wallet.setBalance(new BigDecimal("8500.00"));
        wallet.setTotalEarnings(new BigDecimal("15000.00"));
        wallet.setTotalWithdrawn(new BigDecimal("0.00"));
        when(mechanicWalletRepository.findById(5L)).thenReturn(Optional.of(wallet));
        when(mechanicWalletRepository.save(any(MechanicWallet.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(transactionRepository.save(any(WalletTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WithdrawalRequest request = new WithdrawalRequest(mechanicId, 3L, 5L, new BigDecimal("5000.00"));
        request.setId(9L);
        when(withdrawalRequestRepository.findById(9L)).thenReturn(Optional.of(request));
        when(withdrawalRequestRepository.save(any(WithdrawalRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WithdrawalRequestResponse response = walletService.approveWithdrawal(9L, 1L);

        assertEquals(WithdrawalStatus.APPROVED, response.getStatus());
        assertEquals(1L, response.getProcessedBy());
        assertNotNull(response.getProcessedAt());
        assertEquals(0, new BigDecimal("3500.00").compareTo(wallet.getBalance()));
        assertEquals(0, new BigDecimal("5000.00").compareTo(wallet.getTotalWithdrawn()));

        ArgumentCaptor<WalletTransaction> txnCaptor = ArgumentCaptor.forClass(WalletTransaction.class);
        verify(transactionRepository).save(txnCaptor.capture());
        assertEquals(WalletTransactionType.WITHDRAWAL, txnCaptor.getValue().getTransactionType());
        assertEquals(0, new BigDecimal("5000.00").compareTo(txnCaptor.getValue().getAmount()));
        assertEquals(0, new BigDecimal("3500.00").compareTo(txnCaptor.getValue().getBalanceAfterTransaction()));

        // The mechanic is notified of the approval with the new balance
        ArgumentCaptor<WithdrawalRequestProcessedEvent> eventCaptor =
                ArgumentCaptor.forClass(WithdrawalRequestProcessedEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_WITHDRAWAL_PROCESSED),
                eventCaptor.capture());
        WithdrawalRequestProcessedEvent event = eventCaptor.getValue();
        assertEquals("APPROVED", event.getStatus());
        assertEquals(9L, event.getWithdrawalId());
        assertEquals(mechanicId, event.getMechanicId());
        assertEquals(3L, event.getMechanicUserId());
        assertEquals(0, new BigDecimal("5000.00").compareTo(event.getAmount()));
        assertEquals(0, new BigDecimal("3500.00").compareTo(event.getBalance()));
    }

    @Test
    void approveWithdrawal_WhenBalanceDropped_ShouldAutoReject() {
        MechanicWallet wallet = new MechanicWallet(mechanicId);
        wallet.setId(5L);
        wallet.setBalance(new BigDecimal("3000.00")); // below the requested 5000
        when(mechanicWalletRepository.findById(5L)).thenReturn(Optional.of(wallet));

        WithdrawalRequest request = new WithdrawalRequest(mechanicId, 3L, 5L, new BigDecimal("5000.00"));
        request.setId(9L);
        when(withdrawalRequestRepository.findById(9L)).thenReturn(Optional.of(request));
        when(withdrawalRequestRepository.save(any(WithdrawalRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WithdrawalRequestResponse response = walletService.approveWithdrawal(9L, 1L);

        assertEquals(WithdrawalStatus.REJECTED, response.getStatus());
        // No debit, no withdrawal ledger entry
        assertEquals(0, new BigDecimal("3000.00").compareTo(wallet.getBalance()));
        verify(transactionRepository, never()).save(any());

        // The mechanic is still told — the request was auto-rejected
        ArgumentCaptor<WithdrawalRequestProcessedEvent> eventCaptor =
                ArgumentCaptor.forClass(WithdrawalRequestProcessedEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_WITHDRAWAL_PROCESSED),
                eventCaptor.capture());
        assertEquals("REJECTED", eventCaptor.getValue().getStatus());
        assertEquals(0, new BigDecimal("3000.00").compareTo(eventCaptor.getValue().getBalance()));
    }

    @Test
    void rejectWithdrawal_ShouldMarkRejected() {
        WithdrawalRequest request = new WithdrawalRequest(mechanicId, 3L, 5L, new BigDecimal("5000.00"));
        request.setId(9L);
        when(withdrawalRequestRepository.findById(9L)).thenReturn(Optional.of(request));
        when(withdrawalRequestRepository.save(any(WithdrawalRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        WithdrawalRequestResponse response = walletService.rejectWithdrawal(9L, 1L);

        assertEquals(WithdrawalStatus.REJECTED, response.getStatus());
        assertEquals(1L, response.getProcessedBy());
        verify(mechanicWalletRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());

        // The mechanic is notified of the rejection
        ArgumentCaptor<WithdrawalRequestProcessedEvent> eventCaptor =
                ArgumentCaptor.forClass(WithdrawalRequestProcessedEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_WITHDRAWAL_PROCESSED),
                eventCaptor.capture());
        assertEquals("REJECTED", eventCaptor.getValue().getStatus());
        assertEquals(3L, eventCaptor.getValue().getMechanicUserId());
    }

    @Test
    void approveWithdrawal_NonPending_ShouldThrow() {
        WithdrawalRequest request = new WithdrawalRequest(mechanicId, 3L, 5L, new BigDecimal("5000.00"));
        request.setId(9L);
        request.setStatus(WithdrawalStatus.APPROVED);
        when(withdrawalRequestRepository.findById(9L)).thenReturn(Optional.of(request));

        assertThrows(IllegalArgumentException.class, () -> walletService.approveWithdrawal(9L, 1L));
        assertThrows(IllegalArgumentException.class, () -> walletService.rejectWithdrawal(9L, 1L));
    }

    @Test
    void approveWithdrawal_MissingRequest_ShouldThrow() {
        when(withdrawalRequestRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(WithdrawalRequestNotFoundException.class,
                () -> walletService.approveWithdrawal(99L, 1L));
    }
}
