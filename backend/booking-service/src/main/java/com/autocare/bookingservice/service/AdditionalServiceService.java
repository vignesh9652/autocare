package com.autocare.bookingservice.service;

import com.autocare.bookingservice.client.MechanicServiceClient;
import com.autocare.bookingservice.config.RabbitMQConfig;
import com.autocare.bookingservice.dto.*;
import com.autocare.bookingservice.entity.AdditionalServiceRequest;
import com.autocare.bookingservice.entity.AdditionalServiceStatus;
import com.autocare.bookingservice.entity.Booking;
import com.autocare.bookingservice.entity.BookingStatus;
import com.autocare.bookingservice.entity.ServiceCatalog;
import com.autocare.bookingservice.exception.AdditionalServiceNotFoundException;
import com.autocare.bookingservice.exception.BookingNotFoundException;
import com.autocare.bookingservice.exception.BookingNotOwnedException;
import com.autocare.bookingservice.exception.InvalidStatusTransitionException;
import com.autocare.bookingservice.exception.ServiceNotFoundException;
import com.autocare.bookingservice.repository.AdditionalServiceRequestRepository;
import com.autocare.bookingservice.repository.BookingRepository;
import com.autocare.bookingservice.repository.ServiceCatalogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Additional Service / Vehicle Inspection feature.
 *
 * <p>"No surprise billing": a mechanic who finds extra work during inspection
 * creates a {@link AdditionalServiceRequest} with the official catalogue price
 * (never a client-supplied amount). The customer must approve it before the
 * mechanic performs it and before it contributes to the booking's final
 * amount.</p>
 */
@Service
public class AdditionalServiceService {

    private static final Logger log = LoggerFactory.getLogger(AdditionalServiceService.class);

    private final AdditionalServiceRequestRepository requestRepository;
    private final BookingRepository bookingRepository;
    private final ServiceCatalogRepository serviceCatalogRepository;
    private final MechanicServiceClient mechanicServiceClient;
    private final RabbitTemplate rabbitTemplate;

    public AdditionalServiceService(AdditionalServiceRequestRepository requestRepository,
                                    BookingRepository bookingRepository,
                                    ServiceCatalogRepository serviceCatalogRepository,
                                    MechanicServiceClient mechanicServiceClient,
                                    RabbitTemplate rabbitTemplate) {
        this.requestRepository = requestRepository;
        this.bookingRepository = bookingRepository;
        this.serviceCatalogRepository = serviceCatalogRepository;
        this.mechanicServiceClient = mechanicServiceClient;
        this.rabbitTemplate = rabbitTemplate;
    }

    // ─── Mechanic: raise a request ─────────────────────────────────────────

    /**
     * Creates a PENDING additional-service request. The mechanic's identity
     * comes from the JWT (never the body); the price is resolved from the
     * platform catalogue.
     */
    @Transactional
    public AdditionalServiceResponse create(Long mechanicUserId, AdditionalServiceCreateRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BookingNotFoundException(
                        "Booking not found with id: " + request.getBookingId()));

        // The mechanic must be the one assigned to this booking.
        Long mechanicProfileId = mechanicServiceClient.getMechanicIdByUserId(mechanicUserId);
        if (mechanicProfileId == null || !mechanicProfileId.equals(booking.getMechanicId())) {
            throw new BookingNotOwnedException("This booking is not assigned to you");
        }

        // Requests are only allowed while the mechanic is with the customer.
        if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
            throw new InvalidStatusTransitionException(
                    "Additional services can only be added while the service is IN_PROGRESS");
        }

        ServiceCatalog service = serviceCatalogRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ServiceNotFoundException(
                        "Service not found with id: " + request.getServiceId()));
        if (!service.isActive()) {
            throw new IllegalArgumentException(
                    "The service \"" + service.getServiceName() + "\" is currently not available");
        }

        // No duplicate unresolved request for the same booking + service.
        if (requestRepository.existsByBookingIdAndServiceIdAndStatusIn(
                booking.getId(), service.getId(),
                List.of(AdditionalServiceStatus.PENDING, AdditionalServiceStatus.APPROVED))) {
            throw new IllegalArgumentException(
                    "An additional service request for \"" + service.getServiceName()
                            + "\" is already pending or approved for this booking");
        }

        // Price is authoritative from the catalogue — the client can't send one.
        BigDecimal amount = service.getBasePrice();
        if (amount == null || amount.signum() < 0) {
            throw new IllegalArgumentException(
                    "Service \"" + service.getServiceName() + "\" has no valid price");
        }

        AdditionalServiceRequest entity = new AdditionalServiceRequest(
                booking.getId(),
                mechanicProfileId,
                mechanicUserId,
                booking.getUserId(),
                service.getId(),
                service.getServiceName(),
                request.getReason(),
                amount
        );
        entity = requestRepository.save(entity);

        BigDecimal newTotal = estimatedOrZero(booking).add(amount);
        AdditionalServiceRequestedEvent event = new AdditionalServiceRequestedEvent(
                entity.getBookingId(),
                entity.getCustomerId(),
                entity.getMechanicUserId(),
                entity.getServiceId(),
                entity.getServiceName(),
                entity.getReason(),
                entity.getAmount(),
                newTotal
        );
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_ADDITIONAL_SERVICE_REQUESTED,
                event
        );
        log.info("🔧 Additional service request #{} ({} ₹{}) raised for booking #{} — awaiting customer approval",
                entity.getId(), entity.getServiceName(), entity.getAmount(), entity.getBookingId());

        return toResponse(entity);
    }

    // ─── Views ─────────────────────────────────────────────────────────────

    /**
     * Requests for one booking. Customers see their own bookings, mechanics
     * their assigned jobs, and admins anything.
     */
    @Transactional(readOnly = true)
    public List<AdditionalServiceResponse> getByBooking(Long bookingId, Long userId, String role) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(
                        "Booking not found with id: " + bookingId));

        if (!"ADMIN".equals(role)) {
            boolean isOwner = booking.getUserId().equals(userId);
            boolean isAssigned = false;
            if (!isOwner) {
                Long profileId = mechanicServiceClient.getMechanicIdByUserId(userId);
                isAssigned = profileId != null && profileId.equals(booking.getMechanicId());
            }
            if (!isOwner && !isAssigned) {
                throw new BookingNotOwnedException(
                        "You do not have access to this booking's additional service requests");
            }
        }

        return requestRepository.findByBookingIdOrderByCreatedAtDesc(bookingId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdditionalServiceResponse> getAllForAdmin() {
        return requestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── Customer: approve / reject ────────────────────────────────────────

    @Transactional
    public AdditionalServiceResponse approve(Long requestId, Long customerUserId) {
        AdditionalServiceRequest entity = loadOwnedByCustomer(requestId, customerUserId);
        if (entity.getStatus() != AdditionalServiceStatus.PENDING) {
            throw new IllegalArgumentException(
                    "This request was already " + entity.getStatus().name().toLowerCase()
                            + " — it can no longer be approved");
        }
        entity.setStatus(AdditionalServiceStatus.APPROVED);
        entity.setCustomerResponseAt(LocalDateTime.now());
        entity = requestRepository.save(entity);

        recalculateBookingAmounts(entity.getBookingId());

        AdditionalServiceApprovedEvent event = new AdditionalServiceApprovedEvent(
                entity.getBookingId(),
                entity.getMechanicUserId(),
                entity.getId(),
                entity.getServiceName(),
                entity.getAmount()
        );
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_ADDITIONAL_SERVICE_APPROVED,
                event
        );
        log.info("✅ Customer approved additional service \"{}\" (₹{}) for booking #{}",
                entity.getServiceName(), entity.getAmount(), entity.getBookingId());

        return toResponse(entity);
    }

    @Transactional
    public AdditionalServiceResponse reject(Long requestId, Long customerUserId) {
        AdditionalServiceRequest entity = loadOwnedByCustomer(requestId, customerUserId);
        if (entity.getStatus() != AdditionalServiceStatus.PENDING) {
            throw new IllegalArgumentException(
                    "This request was already " + entity.getStatus().name().toLowerCase()
                            + " — it can no longer be rejected");
        }
        entity.setStatus(AdditionalServiceStatus.REJECTED);
        entity.setCustomerResponseAt(LocalDateTime.now());
        entity = requestRepository.save(entity);

        // Rejected amounts never contribute — recompute drops them.
        recalculateBookingAmounts(entity.getBookingId());

        AdditionalServiceRejectedEvent event = new AdditionalServiceRejectedEvent(
                entity.getBookingId(),
                entity.getMechanicUserId(),
                entity.getId(),
                entity.getServiceName(),
                entity.getAmount()
        );
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_ADDITIONAL_SERVICE_REJECTED,
                event
        );
        log.info("❌ Customer rejected additional service \"{}\" (₹{}) for booking #{}",
                entity.getServiceName(), entity.getAmount(), entity.getBookingId());

        return toResponse(entity);
    }

    // ─── Shared helpers ────────────────────────────────────────────────────

    private AdditionalServiceRequest loadOwnedByCustomer(Long requestId, Long customerUserId) {
        AdditionalServiceRequest entity = requestRepository.findById(requestId)
                .orElseThrow(() -> new AdditionalServiceNotFoundException(
                        "Additional service request not found with id: " + requestId));
        if (!entity.getCustomerId().equals(customerUserId)) {
            throw new BookingNotOwnedException("This request does not belong to you");
        }
        return entity;
    }

    /**
     * booking.additionalAmount = sum of APPROVED requests only. Pending and
     * rejected requests never count towards the final bill.
     */
    private void recalculateBookingAmounts(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException(
                        "Booking not found with id: " + bookingId));
        BigDecimal additional = requestRepository.findByBookingIdOrderByCreatedAtDesc(bookingId)
                .stream()
                .filter(r -> r.getStatus() == AdditionalServiceStatus.APPROVED)
                .map(AdditionalServiceRequest::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        booking.setAdditionalAmount(additional);
        bookingRepository.save(booking);
    }

    private BigDecimal estimatedOrZero(Booking booking) {
        return booking.getEstimatedAmount() != null ? booking.getEstimatedAmount() : BigDecimal.ZERO;
    }

    private AdditionalServiceResponse toResponse(AdditionalServiceRequest entity) {
        return new AdditionalServiceResponse(
                entity.getId(),
                entity.getBookingId(),
                entity.getMechanicId(),
                entity.getCustomerId(),
                entity.getServiceId(),
                entity.getServiceName(),
                entity.getReason(),
                entity.getAmount(),
                entity.getStatus(),
                entity.getCustomerResponseAt(),
                entity.getCreatedAt()
        );
    }
}
