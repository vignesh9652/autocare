package com.autocare.mechanicservice.repository;

import com.autocare.mechanicservice.entity.MechanicEarning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MechanicEarningRepository extends JpaRepository<MechanicEarning, Long> {

    List<MechanicEarning> findByMechanicIdOrderByCreatedAtDesc(Long mechanicId);

    boolean existsByBookingId(Long bookingId);
}
