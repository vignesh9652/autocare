package com.autocare.paymentservice.repository;

import com.autocare.paymentservice.entity.Transaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Pessimistic lock serializes concurrent webhook callbacks for the same
     * gatewayTransactionId so a duplicate webhook cannot slip past the
     * idempotency check and double-publish events.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Transaction> findByGatewayTransactionId(String gatewayTransactionId);
}
