package com.autocare.reviewservice.repository;

import com.autocare.reviewservice.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    /**
     * Find the review for a specific booking (one review per booking).
     */
    Optional<Review> findByBookingId(Long bookingId);

    /**
     * All reviews for a mechanic, newest first.
     */
    List<Review> findByMechanicIdOrderByCreatedAtDesc(Long mechanicId);

    /**
     * True if a booking has already been reviewed.
     */
    boolean existsByBookingId(Long bookingId);
}
