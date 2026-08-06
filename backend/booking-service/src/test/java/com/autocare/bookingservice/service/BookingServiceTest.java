package com.autocare.bookingservice.service;

import com.autocare.bookingservice.client.MechanicServiceClient;
import com.autocare.bookingservice.client.VehicleServiceClient;
import com.autocare.bookingservice.config.RabbitMQConfig;
import com.autocare.bookingservice.dto.BookingRequest;
import com.autocare.bookingservice.dto.BookingResponse;
import com.autocare.bookingservice.entity.Booking;
import com.autocare.bookingservice.entity.BookingStatus;
import com.autocare.bookingservice.exception.BookingNotFoundException;
import com.autocare.bookingservice.exception.BookingNotOwnedException;
import com.autocare.bookingservice.exception.InvalidStatusTransitionException;
import com.autocare.bookingservice.exception.NoAvailableMechanicException;
import com.autocare.bookingservice.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private VehicleServiceClient vehicleServiceClient;

    @Mock
    private MechanicServiceClient mechanicServiceClient;

    @Mock
    private RabbitTemplate rabbitTemplate;

    private BookingService bookingService;

    // Non-null sentinel to pass to convertAndSend when we just need to avoid NPE
    private static final Object ANY_EVENT = new Object();

    private BookingRequest request;
    private Booking booking;
    private final Long userId = 1L;
    private final Long otherUserId = 2L;
    private final Long mechanicUserId = 3L;
    private final Long vehicleId = 10L;
    private final Long mechanicId = 20L;
    private final Long bookingId = 100L;

    @BeforeEach
    void setUp() {
        bookingService = new BookingService(bookingRepository, vehicleServiceClient,
                mechanicServiceClient, rabbitTemplate);

        request = new BookingRequest();
        request.setVehicleId(vehicleId);
        request.setServiceType("Oil Change");
        request.setScheduledAt(LocalDateTime.of(2026, 8, 1, 10, 0));
        request.setAddress("123 Main St");
        request.setPreferredSkill("Oil Change");
        request.setServiceArea("Downtown");

        booking = new Booking(userId, vehicleId, mechanicId, "Oil Change",
                LocalDateTime.of(2026, 8, 1, 10, 0), "123 Main St");
        booking.setId(bookingId);
        booking.setStatus(BookingStatus.PENDING);
    }

    // ─── CREATE BOOKING ────────────────────────────────────────────────

    @Test
    void createBooking_ShouldReturnBookingResponse() {
        doNothing().when(vehicleServiceClient).validateVehicleOwnership(vehicleId, userId);
        when(mechanicServiceClient.findAvailableMechanic("Oil Change", "Downtown"))
                .thenReturn(mechanicId);
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);
        doNothing().when(rabbitTemplate).convertAndSend(
                anyString(), anyString(), any(Object.class));

        BookingResponse response = bookingService.createBooking(userId, request);

        assertNotNull(response);
        assertEquals(bookingId, response.getId());
        assertEquals(userId, response.getUserId());
        assertEquals(vehicleId, response.getVehicleId());
        assertEquals(mechanicId, response.getMechanicId());
        assertEquals("Oil Change", response.getServiceType());
        assertEquals(BookingStatus.PENDING, response.getStatus());
        assertEquals("123 Main St", response.getAddress());

        verify(vehicleServiceClient).validateVehicleOwnership(vehicleId, userId);
        verify(mechanicServiceClient).findAvailableMechanic("Oil Change", "Downtown");
        verify(bookingRepository).save(any(Booking.class));
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_BOOKING_CREATED),
                any(Object.class));
    }

    @Test
    void createBooking_NoPreferredSkill_ShouldFindMechanicWithoutSkill() {
        request.setPreferredSkill(null);
        request.setServiceArea(null);

        doNothing().when(vehicleServiceClient).validateVehicleOwnership(vehicleId, userId);
        when(mechanicServiceClient.findAvailableMechanic(null, null))
                .thenReturn(mechanicId);
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);
        doNothing().when(rabbitTemplate).convertAndSend(
                anyString(), anyString(), any(Object.class));

        BookingResponse response = bookingService.createBooking(userId, request);

        assertNotNull(response);
        assertEquals(bookingId, response.getId());
        verify(mechanicServiceClient).findAvailableMechanic(null, null);
    }

    @Test
    void createBooking_WhenNoMechanicAvailable_ShouldThrow() {
        doNothing().when(vehicleServiceClient).validateVehicleOwnership(vehicleId, userId);
        when(mechanicServiceClient.findAvailableMechanic("Oil Change", "Downtown"))
                .thenThrow(new NoAvailableMechanicException("No mechanic available"));

        assertThrows(NoAvailableMechanicException.class,
                () -> bookingService.createBooking(userId, request));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void createBooking_WhenVehicleNotOwned_ShouldThrow() {
        doThrow(new BookingNotOwnedException("Not yours"))
                .when(vehicleServiceClient).validateVehicleOwnership(vehicleId, userId);

        assertThrows(BookingNotOwnedException.class,
                () -> bookingService.createBooking(userId, request));
        verify(bookingRepository, never()).save(any());
    }

    // ─── GET USER BOOKINGS ─────────────────────────────────────────────

    @Test
    void getUserBookings_ShouldReturnList() {
        Booking booking2 = new Booking(userId, 11L, 21L, "Brake Repair",
                LocalDateTime.of(2026, 8, 2, 14, 0), "456 Oak Ave");
        booking2.setId(101L);

        when(bookingRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(booking, booking2));

        List<BookingResponse> responses = bookingService.getUserBookings(userId);

        assertEquals(2, responses.size());
        assertEquals("Oil Change", responses.get(0).getServiceType());
        assertEquals("Brake Repair", responses.get(1).getServiceType());
    }

    @Test
    void getUserBookings_WithNoBookings_ShouldReturnEmptyList() {
        when(bookingRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        List<BookingResponse> responses = bookingService.getUserBookings(userId);

        assertTrue(responses.isEmpty());
    }

    // ─── GET BOOKING BY ID ─────────────────────────────────────────────

    @Test
    void getBookingById_ShouldReturnBooking() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        BookingResponse response = bookingService.getBookingById(bookingId, userId);

        assertNotNull(response);
        assertEquals(bookingId, response.getId());
        assertEquals("Oil Change", response.getServiceType());
    }

    @Test
    void getBookingById_WithWrongOwner_ShouldThrow() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        assertThrows(BookingNotOwnedException.class,
                () -> bookingService.getBookingById(bookingId, otherUserId));
    }

    @Test
    void getBookingById_WithNonExistentId_ShouldThrow() {
        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(BookingNotFoundException.class,
                () -> bookingService.getBookingById(999L, userId));
    }

    // ─── MECHANIC BOOKINGS ─────────────────────────────────────────────

    @Test
    void getMechanicBookings_ShouldReturnAssignedBookings() {
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicId);
        when(bookingRepository.findByMechanicIdOrderByCreatedAtDesc(mechanicId))
                .thenReturn(List.of(booking));

        List<BookingResponse> responses = bookingService.getMechanicBookings(mechanicUserId);

        assertEquals(1, responses.size());
        assertEquals(bookingId, responses.get(0).getId());
    }

    @Test
    void getMechanicBookings_WithoutLinkedProfile_ShouldReturnEmpty() {
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(null);

        assertTrue(bookingService.getMechanicBookings(mechanicUserId).isEmpty());
    }

    // ─── UPDATE STATUS — CUSTOMER ──────────────────────────────────────

    @Test
    void customer_PendingToCancelled_ShouldSucceed() {
        booking.setStatus(BookingStatus.PENDING);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        Booking cancelled = new Booking(userId, vehicleId, mechanicId, "Oil Change",
                LocalDateTime.of(2026, 8, 1, 10, 0), "123 Main St");
        cancelled.setId(bookingId);
        cancelled.setStatus(BookingStatus.CANCELLED);
        when(bookingRepository.save(any(Booking.class))).thenReturn(cancelled);

        BookingResponse response = bookingService.updateBookingStatus(
                bookingId, BookingStatus.CANCELLED, userId, "CUSTOMER");

        assertEquals(BookingStatus.CANCELLED, response.getStatus());
        verify(rabbitTemplate, never()).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_BOOKING_COMPLETED), any(Object.class));
    }

    @Test
    void customer_AcceptedToCancelled_ShouldSucceed() {
        booking.setStatus(BookingStatus.ACCEPTED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        Booking cancelled = new Booking(userId, vehicleId, mechanicId, "Oil Change",
                LocalDateTime.of(2026, 8, 1, 10, 0), "123 Main St");
        cancelled.setId(bookingId);
        cancelled.setStatus(BookingStatus.CANCELLED);
        when(bookingRepository.save(any(Booking.class))).thenReturn(cancelled);

        BookingResponse response = bookingService.updateBookingStatus(
                bookingId, BookingStatus.CANCELLED, userId, "CUSTOMER");

        assertEquals(BookingStatus.CANCELLED, response.getStatus());
    }

    @Test
    void customer_CannotAcceptBooking_ShouldThrow() {
        booking.setStatus(BookingStatus.PENDING);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        assertThrows(InvalidStatusTransitionException.class,
                () -> bookingService.updateBookingStatus(
                        bookingId, BookingStatus.ACCEPTED, userId, "CUSTOMER"));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void customer_UpdatingAnotherUsersBooking_ShouldThrow() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        assertThrows(BookingNotOwnedException.class,
                () -> bookingService.updateBookingStatus(
                        bookingId, BookingStatus.CANCELLED, otherUserId, "CUSTOMER"));
        verify(bookingRepository, never()).save(any());
    }

    // ─── UPDATE STATUS — MECHANIC ──────────────────────────────────────

    @Test
    void mechanic_PendingToAccepted_ShouldSucceed() {
        booking.setStatus(BookingStatus.PENDING);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicId);

        Booking accepted = new Booking(userId, vehicleId, mechanicId, "Oil Change",
                LocalDateTime.of(2026, 8, 1, 10, 0), "123 Main St");
        accepted.setId(bookingId);
        accepted.setStatus(BookingStatus.ACCEPTED);
        when(bookingRepository.save(any(Booking.class))).thenReturn(accepted);

        BookingResponse response = bookingService.updateBookingStatus(
                bookingId, BookingStatus.ACCEPTED, mechanicUserId, "MECHANIC");

        assertEquals(BookingStatus.ACCEPTED, response.getStatus());
        verify(rabbitTemplate, never()).convertAndSend(
                anyString(), eq(RabbitMQConfig.ROUTING_KEY_BOOKING_COMPLETED), any(Object.class));
    }

    @Test
    void mechanic_PendingToRejected_ShouldSucceed() {
        booking.setStatus(BookingStatus.PENDING);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicId);

        Booking rejected = new Booking(userId, vehicleId, mechanicId, "Oil Change",
                LocalDateTime.of(2026, 8, 1, 10, 0), "123 Main St");
        rejected.setId(bookingId);
        rejected.setStatus(BookingStatus.REJECTED);
        when(bookingRepository.save(any(Booking.class))).thenReturn(rejected);

        BookingResponse response = bookingService.updateBookingStatus(
                bookingId, BookingStatus.REJECTED, mechanicUserId, "MECHANIC");

        assertEquals(BookingStatus.REJECTED, response.getStatus());
    }

    @Test
    void mechanic_FullChain_ToCompleted_ShouldPublishEvent() {
        // PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicId);

        booking.setStatus(BookingStatus.ACCEPTED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        Booking inProgress = new Booking(userId, vehicleId, mechanicId, "Oil Change",
                LocalDateTime.of(2026, 8, 1, 10, 0), "123 Main St");
        inProgress.setId(bookingId);
        inProgress.setStatus(BookingStatus.IN_PROGRESS);
        when(bookingRepository.save(any(Booking.class))).thenReturn(inProgress);

        BookingResponse response = bookingService.updateBookingStatus(
                bookingId, BookingStatus.IN_PROGRESS, mechanicUserId, "MECHANIC");
        assertEquals(BookingStatus.IN_PROGRESS, response.getStatus());

        Booking completed = new Booking(userId, vehicleId, mechanicId, "Oil Change",
                LocalDateTime.of(2026, 8, 1, 10, 0), "123 Main St");
        completed.setId(bookingId);
        completed.setStatus(BookingStatus.COMPLETED);
        when(bookingRepository.save(any(Booking.class))).thenReturn(completed);

        response = bookingService.updateBookingStatus(
                bookingId, BookingStatus.COMPLETED, mechanicUserId, "MECHANIC");

        assertEquals(BookingStatus.COMPLETED, response.getStatus());
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_BOOKING_COMPLETED),
                any(Object.class));
    }

    @Test
    void mechanic_PendingToInProgress_ShouldThrow() {
        booking.setStatus(BookingStatus.PENDING);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicId);

        assertThrows(InvalidStatusTransitionException.class,
                () -> bookingService.updateBookingStatus(
                        bookingId, BookingStatus.IN_PROGRESS, mechanicUserId, "MECHANIC"));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void mechanic_BookingAssignedToAnother_ShouldThrow() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(99L);

        assertThrows(BookingNotOwnedException.class,
                () -> bookingService.updateBookingStatus(
                        bookingId, BookingStatus.ACCEPTED, mechanicUserId, "MECHANIC"));
    }

    @Test
    void mechanic_WithoutLinkedProfile_ShouldThrow() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(null);

        assertThrows(BookingNotOwnedException.class,
                () -> bookingService.updateBookingStatus(
                        bookingId, BookingStatus.ACCEPTED, mechanicUserId, "MECHANIC"));
    }

    @Test
    void mechanic_CompletedToAny_ShouldThrow() {
        booking.setStatus(BookingStatus.COMPLETED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicId);

        assertThrows(InvalidStatusTransitionException.class,
                () -> bookingService.updateBookingStatus(
                        bookingId, BookingStatus.ACCEPTED, mechanicUserId, "MECHANIC"));
    }

    // ─── UPDATE STATUS — ADMIN ─────────────────────────────────────────

    @Test
    void admin_CanSetAnyStatus_ShouldSucceed() {
        booking.setStatus(BookingStatus.PENDING);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        Booking completed = new Booking(userId, vehicleId, mechanicId, "Oil Change",
                LocalDateTime.of(2026, 8, 1, 10, 0), "123 Main St");
        completed.setId(bookingId);
        completed.setStatus(BookingStatus.COMPLETED);
        when(bookingRepository.save(any(Booking.class))).thenReturn(completed);

        BookingResponse response = bookingService.updateBookingStatus(
                bookingId, BookingStatus.COMPLETED, userId, "ADMIN");

        assertEquals(BookingStatus.COMPLETED, response.getStatus());
    }

    // ─── INVALID / MISSING ─────────────────────────────────────────────

    @Test
    void updateStatus_WithNonExistentId_ShouldThrow() {
        when(bookingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(BookingNotFoundException.class,
                () -> bookingService.updateBookingStatus(
                        999L, BookingStatus.ACCEPTED, userId, "CUSTOMER"));
    }
}
