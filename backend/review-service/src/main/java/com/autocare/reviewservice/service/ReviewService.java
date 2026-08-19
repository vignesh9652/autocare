package com.autocare.reviewservice.service;

import com.autocare.reviewservice.client.BookingServiceClient;
import com.autocare.reviewservice.client.MechanicServiceClient;
import com.autocare.reviewservice.dto.ReviewRequest;
import com.autocare.reviewservice.dto.ReviewResponse;
import com.autocare.reviewservice.entity.Review;
import com.autocare.reviewservice.exception.BookingNotCompletedException;
import com.autocare.reviewservice.exception.BookingNotOwnedException;
import com.autocare.reviewservice.exception.ReviewAlreadyExistsException;
import com.autocare.reviewservice.exception.ReviewNotFoundException;
import com.autocare.reviewservice.repository.ReviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private static final String STATUS_COMPLETED = "COMPLETED";

    private final ReviewRepository reviewRepository;
    private final BookingServiceClient bookingServiceClient;
    private final MechanicServiceClient mechanicServiceClient;

    public ReviewService(ReviewRepository reviewRepository,
                         BookingServiceClient bookingServiceClient,
                         MechanicServiceClient mechanicServiceClient) {
        this.reviewRepository = reviewRepository;
        this.bookingServiceClient = bookingServiceClient;
        this.mechanicServiceClient = mechanicServiceClient;
    }

    /**
     * Create a review for a completed booking that belongs to the requesting user.
     * Only one review per booking is allowed.
     *
     * @param userId     the authenticated user (from the JWT)
     * @param request    the review data
     * @param authHeader the caller's raw "Authorization" header, forwarded to
     *                   the booking-service and mechanic-service
     */
    public ReviewResponse createReview(Long userId, ReviewRequest request, String authHeader) {
        // Step 1: Validate the booking exists, belongs to this user, and is COMPLETED
        Map<String, Object> booking = bookingServiceClient.getBooking(request.getBookingId(), authHeader);

        Long bookingOwnerId = ((Number) booking.get("userId")).longValue();
        if (!bookingOwnerId.equals(userId)) {
            throw new BookingNotOwnedException("This booking does not belong to you");
        }

        String status = String.valueOf(booking.get("status"));
        if (!STATUS_COMPLETED.equals(status)) {
            throw new BookingNotCompletedException(
                    "Only completed bookings can be reviewed (current status: " + status + ")");
        }

        // Step 2: One review per booking
        if (reviewRepository.existsByBookingId(request.getBookingId())) {
            throw new ReviewAlreadyExistsException(
                    "A review already exists for booking id: " + request.getBookingId());
        }

        // Step 3: Save the review
        Long mechanicId = ((Number) booking.get("mechanicId")).longValue();
        Review review = new Review(
                request.getBookingId(),
                userId,
                mechanicId,
                request.getRating(),
                request.getComment()
        );
        review = reviewRepository.save(review);

        // Step 4: Update the mechanic's average rating (and totalJobsCompleted)
        mechanicServiceClient.updateMechanicRating(mechanicId, request.getRating(), authHeader);

        return toResponse(review);
    }

    public List<ReviewResponse> getReviewsByMechanic(Long mechanicId) {
        return reviewRepository.findByMechanicIdOrderByCreatedAtDesc(mechanicId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ReviewResponse getReviewByBooking(Long bookingId) {
        Review review = reviewRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ReviewNotFoundException(
                        "No review found for booking id: " + bookingId));
        return toResponse(review);
    }

    private ReviewResponse toResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getBookingId(),
                review.getMechanicId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
