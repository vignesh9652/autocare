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
import com.autocare.bookingservice.exception.NoAvailableMechanicException;
import com.autocare.bookingservice.repository.BookingRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final VehicleServiceClient vehicleServiceClient;
    private final MechanicServiceClient mechanicServiceClient;
    private final ServiceCatalogService serviceCatalogService;
    private final RabbitTemplate rabbitTemplate;
    private final BookingEventPublisher eventPublisher;

    public BookingService(BookingRepository bookingRepository,
                          VehicleServiceClient vehicleServiceClient,
                          MechanicServiceClient mechanicServiceClient,
                          ServiceCatalogService serviceCatalogService,
                          RabbitTemplate rabbitTemplate,
                          BookingEventPublisher eventPublisher) {
        this.bookingRepository = bookingRepository;
        this.vehicleServiceClient = vehicleServiceClient;
        this.mechanicServiceClient = mechanicServiceClient;
        this.serviceCatalogService = serviceCatalogService;
        this.rabbitTemplate = rabbitTemplate;
        this.eventPublisher = eventPublisher;
    }

    public BookingResponse createBooking(Long userId, BookingRequest request) {
        // Step 1: Validate that the vehicle exists and belongs to the user
        vehicleServiceClient.validateVehicleOwnership(request.getVehicleId(), userId);

        // Step 2: Resolve the mechanic — the customer-chosen one when provided,
        // otherwise the first available mechanic matching skill / service area.
        // In both cases we fetch the profile so we can verify availability and
        // resolve the mechanic's user account id for notifications.
        Long mechanicId;
        Map mechanic;
        if (request.getMechanicId() != null) {
            mechanic = mechanicServiceClient.getMechanicById(request.getMechanicId());
            if (mechanic == null || !"AVAILABLE".equals(mechanic.get("availabilityStatus"))) {
                throw new NoAvailableMechanicException(
                        "The selected mechanic is not available right now");
            }
            mechanicId = request.getMechanicId();
        } else {
            mechanicId = mechanicServiceClient.findAvailableMechanic(
                    request.getPreferredSkill(), request.getServiceArea());
            mechanic = mechanicServiceClient.getMechanicById(mechanicId);
            if (mechanic == null) {
                throw new NoAvailableMechanicException(
                        "The assigned mechanic profile could not be found");
            }
        }

        Long mechanicUserId = null;
        Object mUserId = mechanic.get("userId");
        if (mUserId instanceof Number n) {
            mechanicUserId = n.longValue();
        }

        // Step 3: Compute the platform-controlled estimate. Prices are always
        // resolved from the catalogue — the client-supplied estimatedAmount is
        // ignored, and any service (including one typed in manually) that is
        // not in the catalogue fails the booking.
        BigDecimal estimatedAmount = serviceCatalogService.resolveEstimatedAmount(
                request.getServiceType());

        // Persist the customer's GPS-fixed service location + the estimate the
        // customer saw. The final amount is only confirmed after inspection.
        Booking booking = new Booking(
                userId,
                request.getVehicleId(),
                mechanicId,
                request.getServiceType(),
                request.getScheduledAt(),
                request.getAddress()
        );
        booking.setLatitude(request.getLatitude());
        booking.setLongitude(request.getLongitude());
        booking.setEstimatedAmount(estimatedAmount);

        booking = bookingRepository.save(booking);

        // Step 4: Publish BookingCreatedEvent to RabbitMQ
        BookingCreatedEvent event = new BookingCreatedEvent(
                booking.getId(),
                userId,
                mechanicId,
                mechanicUserId,
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

    /**
     * All bookings across all users. Admin-only (guarded by SecurityConfig).
     */
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Bookings assigned to the mechanic account identified by {@code userId}.
     * Resolves the mechanic profile via mechanic-service; returns an empty
     * list when the account has no linked profile.
     */
    public List<BookingResponse> getMechanicBookings(Long userId) {
        Long mechanicId = mechanicServiceClient.getMechanicIdByUserId(userId);
        if (mechanicId == null) {
            return List.of();
        }
        return bookingRepository.findByMechanicIdOrderByCreatedAtDesc(mechanicId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public BookingResponse getBookingById(Long id, Long userId) {
        Booking booking = findBookingByIdAndOwnershipCheck(id, userId);
        return toResponse(booking);
    }

    public BookingResponse updateBookingStatus(Long id, BookingStatus newStatus, Long userId, String role) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));

        // Role-based authorization before any state change.
        authorizeStatusUpdate(booking, newStatus, userId, role);

        booking.setStatus(newStatus);

        // Service completed → generate the final amount (MVP: equals the
        // estimate; an inspection could later adjust it).
        if (newStatus == BookingStatus.COMPLETED && booking.getFinalAmount() == null) {
            booking.setFinalAmount(booking.getEstimatedAmount() != null
                    ? booking.getEstimatedAmount()
                    : BigDecimal.ZERO);
        }

        booking = bookingRepository.save(booking);

        BookingResponse response = toResponse(booking);

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

        // Push the new status to any live-tracked SSE subscribers
        eventPublisher.publishStatusChange(response);

        return response;
    }

    private Booking findBookingByIdAndOwnershipCheck(Long id, Long userId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + id));

        if (!booking.getUserId().equals(userId)) {
            throw new BookingNotOwnedException("This booking does not belong to you");
        }

        return booking;
    }

    /**
     * Enforces role-based rules on status changes:
     * <ul>
     *   <li><b>ADMIN</b> — may set any status on any booking.</li>
     *   <li><b>MECHANIC</b> — may only touch bookings assigned to them, driving
     *       the job lifecycle: accept / reject / start / complete.</li>
     *   <li><b>CUSTOMER</b> — may only cancel their own booking.</li>
     * </ul>
     */
    private void authorizeStatusUpdate(Booking booking, BookingStatus newStatus, Long userId, String role) {
        if ("ADMIN".equals(role)) {
            return;
        }

        if ("MECHANIC".equals(role)) {
            Long mechanicId = mechanicServiceClient.getMechanicIdByUserId(userId);
            if (mechanicId == null || !mechanicId.equals(booking.getMechanicId())) {
                throw new BookingNotOwnedException("This booking is not assigned to you");
            }
            boolean valid = switch (booking.getStatus()) {
                case PENDING -> newStatus == BookingStatus.ACCEPTED || newStatus == BookingStatus.REJECTED;
                case ACCEPTED -> newStatus == BookingStatus.IN_PROGRESS;
                case IN_PROGRESS -> newStatus == BookingStatus.COMPLETED;
                case COMPLETED, PAYMENT_PENDING, PAID, CANCELLED, REJECTED -> false;
            };
            if (!valid) {
                throw new InvalidStatusTransitionException(
                        "Mechanic cannot transition from " + booking.getStatus() + " to " + newStatus);
            }
            return;
        }

        // Customer
        if (!booking.getUserId().equals(userId)) {
            throw new BookingNotOwnedException("This booking does not belong to you");
        }
        if (newStatus != BookingStatus.CANCELLED) {
            throw new InvalidStatusTransitionException("Customers can only cancel their bookings");
        }
        validateStatusTransition(booking.getStatus(), newStatus);
    }

    private void validateStatusTransition(BookingStatus current, BookingStatus next) {
        // Valid transitions:
        // PENDING -> ACCEPTED, REJECTED, CANCELLED
        // ACCEPTED -> IN_PROGRESS, CANCELLED
        // IN_PROGRESS -> COMPLETED
        // COMPLETED / REJECTED / CANCELLED -> (terminal, no transitions)

        boolean valid = switch (current) {
            case PENDING -> next == BookingStatus.ACCEPTED
                    || next == BookingStatus.REJECTED
                    || next == BookingStatus.CANCELLED;
            case ACCEPTED -> next == BookingStatus.IN_PROGRESS || next == BookingStatus.CANCELLED;
            case IN_PROGRESS -> next == BookingStatus.COMPLETED;
            case COMPLETED -> next == BookingStatus.PAYMENT_PENDING;
            case PAYMENT_PENDING -> next == BookingStatus.PAID || next == BookingStatus.COMPLETED;
            case PAID, REJECTED, CANCELLED -> false;
        };

        if (!valid) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + current + " to " + next);
        }
    }

    // ─── Payment lifecycle (driven by payment-service events) ───────────────

    /**
     * COMPLETED → PAYMENT_PENDING, fired when the customer initiates payment.
     * No-op when the booking is not COMPLETED.
     */
    @Transactional
    public BookingResponse markPaymentInitiated(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + bookingId));
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            return toResponse(booking);
        }
        booking.setStatus(BookingStatus.PAYMENT_PENDING);
        booking = bookingRepository.save(booking);
        return toResponse(booking);
    }

    /**
     * PAYMENT_PENDING → PAID on payment success. Computes the AutoCare
     * commission and the mechanic's earning, persists them on the booking and
     * publishes {@code booking.paid} so mechanic-service can record the
     * mechanic's earning.
     *
     * <p>Defensive by design: idempotent for already-PAID bookings, and
     * out-of-order / mismatched / not-owned payment events are logged and
     * skipped instead of failing, so a stray event can never double-credit
     * earnings or poison the consumer queue.</p>
     *
     * @param payerUserId user id from the payment event (must own the booking)
     * @param paidAmount  amount actually paid (must equal the final amount)
     */
    @Transactional
    public BookingResponse markPaid(Long bookingId, Long paymentId, Long payerUserId, BigDecimal paidAmount) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.PAID) {
            return toResponse(booking); // already processed — acknowledge
        }

        // Only the booking's own customer may pay for it.
        if (payerUserId != null && !booking.getUserId().equals(payerUserId)) {
            log.warn("⚠️ Payment success for booking #{} from user {} — not the owner ({}), ignoring",
                    bookingId, payerUserId, booking.getUserId());
            return toResponse(booking);
        }

        BigDecimal expected = booking.getFinalAmount() != null
                ? booking.getFinalAmount()
                : (booking.getEstimatedAmount() != null ? booking.getEstimatedAmount() : BigDecimal.ZERO);

        // The paid amount must match the final amount the customer approved.
        if (paidAmount != null && paidAmount.compareTo(expected) != 0) {
            log.warn("⚠️ Payment of {} for booking #{} does not match the final amount {} — ignoring",
                    paidAmount, bookingId, expected);
            return toResponse(booking);
        }

        // Out-of-order delivery: only PAYMENT_PENDING bookings may be paid.
        if (booking.getStatus() != BookingStatus.PAYMENT_PENDING) {
            log.warn("⚠️ Payment success for booking #{} arrived while status is {} — ignoring",
                    bookingId, booking.getStatus());
            return toResponse(booking);
        }

        BigDecimal finalAmount = expected;
        booking.setFinalAmount(finalAmount);

        BigDecimal commission = commissionOf(finalAmount);
        BigDecimal earning = finalAmount.subtract(commission);

        booking.setStatus(BookingStatus.PAID);
        booking.setPlatformCommission(commission);
        booking.setMechanicEarning(earning);
        booking = bookingRepository.save(booking);

        BookingPaidEvent event = new BookingPaidEvent(
                booking.getId(),
                booking.getMechanicId(),
                paymentId,
                finalAmount,
                commission,
                earning
        );
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_BOOKING_PAID,
                event
        );

        return toResponse(booking);
    }

    /**
     * PAYMENT_PENDING → COMPLETED when the payment failed, so the customer
     * can retry. No-op unless the booking is awaiting payment.
     */
    @Transactional
    public BookingResponse revertToCompleted(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BookingNotFoundException("Booking not found with id: " + bookingId));
        if (booking.getStatus() != BookingStatus.PAYMENT_PENDING) {
            return toResponse(booking);
        }
        booking.setStatus(BookingStatus.COMPLETED);
        booking = bookingRepository.save(booking);
        return toResponse(booking);
    }

    /** commission = finalAmount × percentage / 100 (rounded to 2dp). */
    private BigDecimal commissionOf(BigDecimal finalAmount) {
        BigDecimal percentage = serviceCatalogService.currentCommissionPercentage();
        return finalAmount.multiply(percentage)
                .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
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
                booking.getLatitude(),
                booking.getLongitude(),
                booking.getEstimatedAmount(),
                booking.getFinalAmount(),
                booking.getPlatformCommission(),
                booking.getMechanicEarning(),
                booking.getCreatedAt()
        );
    }
}
