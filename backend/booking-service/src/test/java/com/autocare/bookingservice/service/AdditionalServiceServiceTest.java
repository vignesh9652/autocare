package com.autocare.bookingservice.service;

import com.autocare.bookingservice.client.MechanicServiceClient;
import com.autocare.bookingservice.config.RabbitMQConfig;
import com.autocare.bookingservice.dto.AdditionalServiceApprovedEvent;
import com.autocare.bookingservice.dto.AdditionalServiceCreateRequest;
import com.autocare.bookingservice.dto.AdditionalServiceRejectedEvent;
import com.autocare.bookingservice.dto.AdditionalServiceRequestedEvent;
import com.autocare.bookingservice.dto.AdditionalServiceResponse;
import com.autocare.bookingservice.entity.AdditionalServiceRequest;
import com.autocare.bookingservice.entity.AdditionalServiceStatus;
import com.autocare.bookingservice.entity.Booking;
import com.autocare.bookingservice.entity.BookingStatus;
import com.autocare.bookingservice.entity.ServiceCatalog;
import com.autocare.bookingservice.exception.BookingNotOwnedException;
import com.autocare.bookingservice.exception.InvalidStatusTransitionException;
import com.autocare.bookingservice.repository.AdditionalServiceRequestRepository;
import com.autocare.bookingservice.repository.BookingRepository;
import com.autocare.bookingservice.repository.ServiceCatalogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdditionalServiceServiceTest {

    @Mock
    private AdditionalServiceRequestRepository requestRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private ServiceCatalogRepository serviceCatalogRepository;
    @Mock
    private MechanicServiceClient mechanicServiceClient;
    @Mock
    private RabbitTemplate rabbitTemplate;

    private AdditionalServiceService service;

    private final Long customerId = 1L;
    private final Long mechanicUserId = 2L;
    private final Long mechanicProfileId = 20L;
    private final Long bookingId = 100L;
    private final Long serviceId = 5L;

    private Booking booking;
    private ServiceCatalog catalogService;

    @BeforeEach
    void setUp() {
        service = new AdditionalServiceService(requestRepository, bookingRepository,
                serviceCatalogRepository, mechanicServiceClient, rabbitTemplate);

        booking = new Booking(customerId, 10L, mechanicProfileId, "Oil Change",
                LocalDateTime.of(2026, 8, 1, 10, 0), "123 Main St");
        booking.setId(bookingId);
        booking.setStatus(BookingStatus.IN_PROGRESS);
        booking.setEstimatedAmount(new BigDecimal("500.00"));

        catalogService = new ServiceCatalog("Brake Pad Replacement", "Worn pads", new BigDecimal("800.00"), true);
        catalogService.setId(serviceId);
    }

    private AdditionalServiceRequest request(AdditionalServiceStatus status) {
        AdditionalServiceRequest r = new AdditionalServiceRequest(
                bookingId, mechanicProfileId, mechanicUserId, customerId, serviceId,
                "Brake Pad Replacement", "Brake pads are worn out", new BigDecimal("800.00"));
        r.setStatus(status);
        return r;
    }

    private AdditionalServiceCreateRequest createRequest() {
        return new AdditionalServiceCreateRequest(bookingId, serviceId, "Brake pads are worn out");
    }

    // ─── MECHANIC CREATES A REQUEST ─────────────────────────────────────

    @Test
    void create_ShouldResolveCataloguePrice_AndPublishPendingRequest() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicProfileId);
        when(serviceCatalogRepository.findById(serviceId)).thenReturn(Optional.of(catalogService));
        when(requestRepository.existsByBookingIdAndServiceIdAndStatusIn(
                eq(bookingId), eq(serviceId), anyList())).thenReturn(false);
        when(requestRepository.save(any(AdditionalServiceRequest.class)))
                .thenAnswer(invocation -> {
                    AdditionalServiceRequest r = invocation.getArgument(0);
                    r.setId(1L);
                    return r;
                });

        AdditionalServiceResponse response = service.create(mechanicUserId, createRequest());

        assertEquals(1L, response.getId());
        assertEquals(bookingId, response.getBookingId());
        assertEquals(AdditionalServiceStatus.PENDING, response.getStatus());
        // Price comes from the catalogue, never from the client
        assertEquals(0, new BigDecimal("800.00").compareTo(response.getAmount()));
        assertEquals("Brake Pad Replacement", response.getServiceName());
        assertEquals(customerId, response.getCustomerId());

        // Customer is notified with the new estimated total
        ArgumentCaptor<AdditionalServiceRequestedEvent> captor =
                ArgumentCaptor.forClass(AdditionalServiceRequestedEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_ADDITIONAL_SERVICE_REQUESTED),
                captor.capture());
        assertEquals(customerId, captor.getValue().getCustomerId());
        assertEquals(0, new BigDecimal("1300.00").compareTo(captor.getValue().getNewTotal()));
    }

    @Test
    void create_ByMechanicNotAssignedToBooking_ShouldThrow() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(999L);

        assertThrows(BookingNotOwnedException.class,
                () -> service.create(mechanicUserId, createRequest()));
        verify(requestRepository, never()).save(any());
    }

    @Test
    void create_ByAccountWithNoMechanicProfile_ShouldThrow() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(null);

        assertThrows(BookingNotOwnedException.class,
                () -> service.create(mechanicUserId, createRequest()));
    }

    @Test
    void create_WhenBookingNotInProgress_ShouldThrow() {
        booking.setStatus(BookingStatus.ACCEPTED);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicProfileId);

        assertThrows(InvalidStatusTransitionException.class,
                () -> service.create(mechanicUserId, createRequest()));
        verify(requestRepository, never()).save(any());
    }

    @Test
    void create_WithInactiveService_ShouldThrow() {
        catalogService.setActive(false);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicProfileId);
        when(serviceCatalogRepository.findById(serviceId)).thenReturn(Optional.of(catalogService));

        assertThrows(IllegalArgumentException.class,
                () -> service.create(mechanicUserId, createRequest()));
    }

    @Test
    void create_DuplicateUnresolvedRequest_ShouldThrow() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicProfileId);
        when(serviceCatalogRepository.findById(serviceId)).thenReturn(Optional.of(catalogService));
        when(requestRepository.existsByBookingIdAndServiceIdAndStatusIn(
                eq(bookingId), eq(serviceId), anyList())).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> service.create(mechanicUserId, createRequest()));
        verify(requestRepository, never()).save(any());
    }

    // ─── CUSTOMER VIEWS ─────────────────────────────────────────────────

    @Test
    void getByBooking_CustomerOwner_ShouldReturnRequests() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(requestRepository.findByBookingIdOrderByCreatedAtDesc(bookingId))
                .thenReturn(List.of(request(AdditionalServiceStatus.PENDING)));

        var responses = service.getByBooking(bookingId, customerId, "CUSTOMER");

        assertEquals(1, responses.size());
        assertEquals(AdditionalServiceStatus.PENDING, responses.get(0).getStatus());
        // No mechanic profile lookup needed for the owner
        verify(mechanicServiceClient, never()).getMechanicIdByUserId(any());
    }

    @Test
    void getByBooking_AssignedMechanic_ShouldReturnRequests() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(mechanicUserId)).thenReturn(mechanicProfileId);
        when(requestRepository.findByBookingIdOrderByCreatedAtDesc(bookingId))
                .thenReturn(List.of(request(AdditionalServiceStatus.APPROVED)));

        var responses = service.getByBooking(bookingId, mechanicUserId, "MECHANIC");

        assertEquals(1, responses.size());
    }

    @Test
    void getByBooking_UnrelatedUser_ShouldThrow() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(mechanicServiceClient.getMechanicIdByUserId(999L)).thenReturn(null);

        assertThrows(BookingNotOwnedException.class,
                () -> service.getByBooking(bookingId, 999L, "CUSTOMER"));
    }

    // ─── CUSTOMER APPROVES / REJECTS ────────────────────────────────────

    @Test
    void approve_ShouldMarkApproved_RecomputeBookingAmount_AndNotifyMechanic() {
        AdditionalServiceRequest pending = request(AdditionalServiceStatus.PENDING);
        pending.setId(1L);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(requestRepository.save(any(AdditionalServiceRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(requestRepository.findByBookingIdOrderByCreatedAtDesc(bookingId))
                .thenReturn(List.of(pending));

        AdditionalServiceResponse response = service.approve(1L, customerId);

        assertEquals(AdditionalServiceStatus.APPROVED, response.getStatus());
        assertNotNull(response.getCustomerResponseAt());

        // Booking additionalAmount = sum of APPROVED (800)
        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        assertEquals(0, new BigDecimal("800.00").compareTo(bookingCaptor.getValue().getAdditionalAmount()));

        ArgumentCaptor<AdditionalServiceApprovedEvent> eventCaptor =
                ArgumentCaptor.forClass(AdditionalServiceApprovedEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_ADDITIONAL_SERVICE_APPROVED),
                eventCaptor.capture());
        assertEquals(mechanicUserId, eventCaptor.getValue().getMechanicUserId());
        assertEquals("Brake Pad Replacement", eventCaptor.getValue().getServiceName());
    }

    @Test
    void approve_ByAnotherCustomer_ShouldThrow() {
        AdditionalServiceRequest pending = request(AdditionalServiceStatus.PENDING);
        pending.setId(1L);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(pending));

        assertThrows(BookingNotOwnedException.class,
                () -> service.approve(1L, 999L));
        verify(requestRepository, never()).save(any());
    }

    @Test
    void approve_AlreadyResolved_ShouldThrow() {
        AdditionalServiceRequest resolved = request(AdditionalServiceStatus.APPROVED);
        resolved.setId(1L);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(resolved));

        assertThrows(IllegalArgumentException.class,
                () -> service.approve(1L, customerId));
        verify(requestRepository, never()).save(any());
    }

    @Test
    void reject_ShouldMarkRejected_AndExcludeFromBookingAmount() {
        AdditionalServiceRequest pending = request(AdditionalServiceStatus.PENDING);
        pending.setId(1L);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(pending));
        when(requestRepository.save(any(AdditionalServiceRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        // Approved list is empty → additionalAmount recomputed to 0
        when(requestRepository.findByBookingIdOrderByCreatedAtDesc(bookingId))
                .thenReturn(List.of(pending));

        AdditionalServiceResponse response = service.reject(1L, customerId);

        assertEquals(AdditionalServiceStatus.REJECTED, response.getStatus());
        assertNotNull(response.getCustomerResponseAt());

        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        assertEquals(0, new BigDecimal("0.00").compareTo(bookingCaptor.getValue().getAdditionalAmount()));

        ArgumentCaptor<AdditionalServiceRejectedEvent> eventCaptor =
                ArgumentCaptor.forClass(AdditionalServiceRejectedEvent.class);
        verify(rabbitTemplate).convertAndSend(
                eq(RabbitMQConfig.TOPIC_EXCHANGE_NAME),
                eq(RabbitMQConfig.ROUTING_KEY_ADDITIONAL_SERVICE_REJECTED),
                eventCaptor.capture());
        assertEquals(mechanicUserId, eventCaptor.getValue().getMechanicUserId());
    }

    @Test
    void multipleApproved_ShouldSumAdditionalAmount() {
        // One request still PENDING is approved now; another is already
        // APPROVED and a third was REJECTED.
        AdditionalServiceRequest brake = request(AdditionalServiceStatus.PENDING);
        brake.setId(1L);
        AdditionalServiceRequest chain = new AdditionalServiceRequest(
                bookingId, mechanicProfileId, mechanicUserId, customerId, 6L,
                "Chain Service", "Chain worn", new BigDecimal("300.00"));
        chain.setStatus(AdditionalServiceStatus.APPROVED);
        chain.setId(2L);
        AdditionalServiceRequest rejected = request(AdditionalServiceStatus.REJECTED);
        rejected.setId(3L);

        when(requestRepository.findById(1L)).thenReturn(Optional.of(brake));
        when(requestRepository.save(any(AdditionalServiceRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(requestRepository.findByBookingIdOrderByCreatedAtDesc(bookingId))
                .thenReturn(List.of(rejected, chain, brake));

        service.approve(1L, customerId);

        ArgumentCaptor<Booking> bookingCaptor = ArgumentCaptor.forClass(Booking.class);
        verify(bookingRepository).save(bookingCaptor.capture());
        // Only the two APPROVED services count (800 + 300); rejected (800) excluded
        assertEquals(0, new BigDecimal("1100.00").compareTo(bookingCaptor.getValue().getAdditionalAmount()));
    }
}
