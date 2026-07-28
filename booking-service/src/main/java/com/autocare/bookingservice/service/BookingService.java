package com.autocare.bookingservice.service;

import com.autocare.bookingservice.client.MechanicServiceClient;
import com.autocare.bookingservice.client.VehicleServiceClient;
import com.autocare.bookingservice.config.RabbitMQConfig;
import com.autocare.bookingservice.dto.*;
import com.autocare.bookingservice.entity.Booking;
import com.autocare.bookingservice.entity.BookingStatus;
import com.autocare.bookingservice.exception.BookingNotFoundException;
import com.autocare.bookingservice.exception.BookingNotOwnedException;
import com.autocare.bookingservice.exception.InvalidStatusTransitionException;
import com.autocare.bookingservice.repository.BookingRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final VehicleServiceClient vehicleServiceClient;
    private final MechanicServiceClient mechanicServiceClient;
    private final RabbitTemplate rabbitTemplate;

    public BookingService(BookingRepository bookingRepository,
                          VehicleServiceClient vehicleServiceClient,
                          MechanicServiceClient mechanicServiceClient,
                          RabbitTemplate rabbitTemplate) {
        this.bookingRepository = bookingRepository;
        this.vehicleServiceClient = vehicleServiceClient;
        this.mechanicServiceClient = mechanicServiceClient;
        this.rabbitTemplate = rabbitTemplate;
    }

    public BookingResponse createBooking(Long userId, BookingRequest request) {
        // Step 1: Validate that the vehicle exists and belongs to the user
        vehicleServiceClient.validateVehicleOwnership(request.getVehicleId(), userId);

        // Step 2: Find an available mechanic matching preferred skill and service area
        Long mechanicId = mechanicServiceClient.findAvailableMechanic(
                request.getPreferredSkill(), request.getServiceArea());

        // Step 3: Create the booking
        Booking booking = new Booking(
                userId,
                request.getVehicleId(),
                mechanicId,
                request.getServiceType(),
                request.getScheduledAt(),
                request.getAddress()
        );

        booking = bookingRepository.save(booking);

        // Step 4: Publish BookingCreatedEvent to RabbitMQ
        BookingCreatedEvent event = new BookingCreatedEvent(
                booking.getId(),
                userId,
                mechanicId,
                booking.getServiceType(),
                booking.getScheduledAt()
        );
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_BOOKING_CREATED,
                event
        );

        return toResponse(booking);
    }

    public List<BookingResponse> getUserBookings(Long userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public BookingResponse getBookingById(Long id, Long userId) {
        Booking booking = findBookingByIdAndOwnershipCheck(id, userId);
        return toResponse(booking);
    }

    public BookingResponse updateBookingStatus(Long id, BookingStatus newStatus, Long userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));

        // Validate status transition
        validateStatusTransition(booking.getStatus(), newStatus);

        booking.setStatus(newStatus);
        booking = bookingRepository.save(booking);

        // If status changed to COMPLETED, publish BookingCompletedEvent
        if (newStatus == BookingStatus.COMPLETED) {
            BookingCompletedEvent event = new BookingCompletedEvent(
                    booking.getId(),
                    booking.getUserId(),
                    booking.getMechanicId(),
                    booking.getServiceType()
            );
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY_BOOKING_COMPLETED,
                    event
            );
        }

        return toResponse(booking);
    }

    private Booking findBookingByIdAndOwnershipCheck(Long id, Long userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));

        if (!booking.getUserId().equals(userId)) {
            throw new BookingNotOwnedException("This booking does not belong to you");
        }

        return booking;
    }

    private void validateStatusTransition(BookingStatus current, BookingStatus next) {
        // Valid transitions:
        // PENDING -> ACCEPTED, CANCELLED
        // ACCEPTED -> IN_PROGRESS, CANCELLED
        // IN_PROGRESS -> COMPLETED
        // COMPLETED -> (terminal, no transitions)
        // CANCELLED -> (terminal, no transitions)

        boolean valid = switch (current) {
            case PENDING -> next == BookingStatus.ACCEPTED || next == BookingStatus.CANCELLED;
            case ACCEPTED -> next == BookingStatus.IN_PROGRESS || next == BookingStatus.CANCELLED;
            case IN_PROGRESS -> next == BookingStatus.COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };

        if (!valid) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + current + " to " + next);
        }
    }

    private BookingResponse toResponse(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getUserId(),
                booking.getVehicleId(),
                booking.getMechanicId(),
                booking.getServiceType(),
                booking.getStatus(),
                booking.getScheduledAt(),
                booking.getAddress(),
                booking.getEstimatedCost(),
                booking.getCreatedAt()
        );
    }
}
