package com.autocare.bookingservice.repository;

import com.autocare.bookingservice.entity.WalletTransaction;
import com.autocare.bookingservice.entity.WalletTransactionType;
import com.autocare.bookingservice.entity.WalletType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    List<WalletTransaction> findByWalletTypeOrderByCreatedAtDesc(WalletType walletType);

    List<WalletTransaction> findByMechanicIdOrderByCreatedAtDesc(Long mechanicId);

    List<WalletTransaction> findByWalletTypeAndBookingIdAndTransactionType(
            WalletType walletType, Long bookingId, WalletTransactionType transactionType);

    boolean existsByWalletTypeAndBookingIdAndTransactionType(
            WalletType walletType, Long bookingId, WalletTransactionType transactionType);

    boolean existsByWalletTypeAndBookingIdAndPaymentIdAndTransactionType(
            WalletType walletType, Long bookingId, Long paymentId, WalletTransactionType transactionType);
}
