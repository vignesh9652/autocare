package com.autocare.sparepartsservice.service;

import com.autocare.sparepartsservice.dto.RecommendationDecisionRequest;
import com.autocare.sparepartsservice.dto.RecommendationRequest;
import com.autocare.sparepartsservice.entity.PartRecommendation;
import com.autocare.sparepartsservice.entity.RecommendationStatus;
import com.autocare.sparepartsservice.entity.SparePart;
import com.autocare.sparepartsservice.exception.InsufficientStockException;
import com.autocare.sparepartsservice.exception.RecommendationAlreadyDecidedException;
import com.autocare.sparepartsservice.exception.RecommendationNotFoundException;
import com.autocare.sparepartsservice.exception.SparePartNotFoundException;
import com.autocare.sparepartsservice.repository.PartRecommendationRepository;
import com.autocare.sparepartsservice.repository.SparePartRepository;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final PartRecommendationRepository recommendationRepository;
    private final SparePartRepository sparePartRepository;

    public RecommendationService(PartRecommendationRepository recommendationRepository,
                                 SparePartRepository sparePartRepository) {
        this.recommendationRepository = recommendationRepository;
        this.sparePartRepository = sparePartRepository;
    }

    public PartRecommendation createRecommendation(Long mechanicId,
                                                    RecommendationRequest request) {
        SparePart sparePart = sparePartRepository.findById(request.getSparePartId())
                .orElseThrow(() -> new SparePartNotFoundException(
                        "Spare part not found with id: " + request.getSparePartId()));

        if (sparePart.getStockQuantity() < request.getQuantity()) {
            throw new InsufficientStockException(
                    "Insufficient stock for part '" + sparePart.getName()
                    + "'. Available: " + sparePart.getStockQuantity()
                    + ", requested: " + request.getQuantity());
        }

        PartRecommendation recommendation = new PartRecommendation(
                request.getBookingId(),
                mechanicId,
                sparePart,
                request.getQuantity(),
                request.getReason()
        );

        return recommendationRepository.save(recommendation);
    }

    public List<PartRecommendation> getRecommendationsByBooking(Long bookingId) {
        return recommendationRepository.findByBookingId(bookingId);
    }

    @Transactional
    public PartRecommendation decideRecommendation(Long recommendationId,
                                                     RecommendationDecisionRequest request) {
        PartRecommendation recommendation = recommendationRepository.findById(recommendationId)
                .orElseThrow(() -> new RecommendationNotFoundException(
                        "Recommendation not found with id: " + recommendationId));

        if (recommendation.getStatus() != RecommendationStatus.RECOMMENDED) {
            throw new RecommendationAlreadyDecidedException(
                    "Recommendation has already been " + recommendation.getStatus().name().toLowerCase()
                    + " and cannot be changed");
        }

        RecommendationStatus newStatus = request.getStatus();

        if (newStatus == RecommendationStatus.APPROVED) {
            SparePart sparePart = recommendation.getSparePart();

            // Check if stock is sufficient before attempting decrement
            if (sparePart.getStockQuantity() < recommendation.getQuantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock for part '" + sparePart.getName()
                        + "'. Available: " + sparePart.getStockQuantity()
                        + ", required: " + recommendation.getQuantity());
            }

            // Decrement stock with optimistic locking (version field ensures consistency)
            int newStock = sparePart.getStockQuantity() - recommendation.getQuantity();
            sparePart.setStockQuantity(newStock);

            try {
                sparePartRepository.save(sparePart);
            } catch (OptimisticLockingFailureException e) {
                throw new OptimisticLockingFailureException(
                        "Concurrent stock update detected. Please retry the operation.");
            }

            recommendation.setStatus(RecommendationStatus.ORDERED);
        } else if (newStatus == RecommendationStatus.REJECTED) {
            recommendation.setStatus(RecommendationStatus.REJECTED);
        } else {
            throw new IllegalArgumentException(
                    "Invalid decision status: " + newStatus
                    + ". Only APPROVED or REJECTED are allowed.");
        }

        recommendation.setDecidedAt(LocalDateTime.now());
        return recommendationRepository.save(recommendation);
    }
}
