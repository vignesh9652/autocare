package com.autocare.reviewservice.controller;

import com.autocare.reviewservice.dto.ReviewRequest;
import com.autocare.reviewservice.dto.ReviewResponse;
import com.autocare.reviewservice.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @Valid @RequestBody ReviewRequest request,
            @RequestHeader("Authorization") String authHeader,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        ReviewResponse response = reviewService.createReview(userId, request, authHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/mechanic/{mechanicId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByMechanic(
            @PathVariable Long mechanicId) {
        List<ReviewResponse> reviews = reviewService.getReviewsByMechanic(mechanicId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<ReviewResponse> getReviewByBooking(
            @PathVariable Long bookingId) {
        ReviewResponse response = reviewService.getReviewByBooking(bookingId);
        return ResponseEntity.ok(response);
    }
}
