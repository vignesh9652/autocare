package com.autocare.sparepartsservice.controller;

import com.autocare.sparepartsservice.dto.RecommendationDecisionRequest;
import com.autocare.sparepartsservice.dto.RecommendationRequest;
import com.autocare.sparepartsservice.dto.RecommendationResponse;
import com.autocare.sparepartsservice.dto.SparePartResponse;
import com.autocare.sparepartsservice.entity.PartRecommendation;
import com.autocare.sparepartsservice.service.SparePartService;
import com.autocare.sparepartsservice.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final SparePartService sparePartService;

    public RecommendationController(RecommendationService recommendationService,
                                    SparePartService sparePartService) {
        this.recommendationService = recommendationService;
        this.sparePartService = sparePartService;
    }

    @PostMapping
    public ResponseEntity<RecommendationResponse> createRecommendation(
            @Valid @RequestBody RecommendationRequest request,
            Authentication authentication) {
        Long mechanicId = (Long) authentication.getPrincipal();
        PartRecommendation recommendation =
                recommendationService.createRecommendation(mechanicId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(recommendation));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<RecommendationResponse>> getBookingRecommendations(
            @PathVariable Long bookingId) {
        List<RecommendationResponse> recommendations =
                recommendationService.getRecommendationsByBooking(bookingId)
                        .stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList());
        return ResponseEntity.ok(recommendations);
    }

    @PutMapping("/{id}/decision")
    public ResponseEntity<RecommendationResponse> decideRecommendation(
            @PathVariable Long id,
            @Valid @RequestBody RecommendationDecisionRequest request) {
        PartRecommendation recommendation =
                recommendationService.decideRecommendation(id, request);
        return ResponseEntity.ok(toResponse(recommendation));
    }

    private RecommendationResponse toResponse(PartRecommendation rec) {
        SparePartResponse partResponse = sparePartService.getPartById(rec.getSparePart().getId());
        return new RecommendationResponse(
                rec.getId(),
                rec.getBookingId(),
                rec.getMechanicId(),
                partResponse,
                rec.getQuantity(),
                rec.getReason(),
                rec.getStatus(),
                rec.getCreatedAt(),
                rec.getDecidedAt()
        );
    }
}
