package com.autocare.bookingservice.repository;

import com.autocare.bookingservice.entity.AdditionalServiceRequest;
import com.autocare.bookingservice.entity.AdditionalServiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdditionalServiceRequestRepository
        extends JpaRepository<AdditionalServiceRequest, Long> {

    List<AdditionalServiceRequest> findByBookingIdOrderByCreatedAtDesc(Long bookingId);

    List<AdditionalServiceRequest> findAllByOrderByCreatedAtDesc();

    boolean existsByBookingIdAndStatus(Long bookingId, AdditionalServiceStatus status);

    boolean existsByBookingIdAndServiceIdAndStatusIn(
            Long bookingId, Long serviceId, List<AdditionalServiceStatus> statuses);
}
