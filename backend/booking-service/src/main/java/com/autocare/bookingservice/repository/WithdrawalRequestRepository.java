package com.autocare.bookingservice.repository;

import com.autocare.bookingservice.entity.WithdrawalRequest;
import com.autocare.bookingservice.entity.WithdrawalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, Long> {

    List<WithdrawalRequest> findByMechanicIdOrderByRequestedAtDesc(Long mechanicId);

    List<WithdrawalRequest> findAllByOrderByRequestedAtDesc();

    List<WithdrawalRequest> findByStatusOrderByRequestedAtDesc(WithdrawalStatus status);
}
