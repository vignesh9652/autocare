package com.autocare.sparepartsservice.repository;

import com.autocare.sparepartsservice.entity.PartRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartRecommendationRepository extends JpaRepository<PartRecommendation, Long> {

    List<PartRecommendation> findByBookingId(Long bookingId);
}
