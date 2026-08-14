package com.autocare.paymentservice.repository;

import com.autocare.paymentservice.entity.PaymentStatus;
import com.autocare.paymentservice.entity.ReferenceType;
import com.autocare.paymentservice.entity.Transaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * True when a payment for the reference is already in-flight (INITIATED)
     * or finished (SUCCESS). Used to prevent duplicate payments for one
     * booking — only FAILED payments free the reference for a retry.
     */
    boolean existsByReferenceTypeAndReferenceIdAndStatusIn(
            ReferenceType referenceType, Long referenceId, Collection<PaymentStatus> statuses);

    /**
     * Pessimistic lock serializes concurrent webhook callbacks for the same
     * gatewayTransactionId so a duplicate webhook cannot slip past the
     * idempotency check and double-publish events.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Transaction> findByGatewayTransactionId(String gatewayTransactionId);
}
