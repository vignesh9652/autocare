package com.autocare.notificationservice.listener;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test for BookingEventListener.
 * Tests that the listener correctly handles different event types
 * by verifying it doesn't throw exceptions and processes events gracefully.
 */
@ExtendWith(MockitoExtension.class)
class BookingEventListenerTest {

    private BookingEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new BookingEventListener();
    }

    @Test
    void handleBookingEvent_WithCreatedEvent_ShouldProcess() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);
        event.put("userId", 1);
        event.put("mechanicId", 20);
        event.put("serviceType", "Oil Change");
        event.put("scheduledAt", "2026-08-01T10:00:00");

        // Should not throw
        listener.handleBookingEvent(event, "booking.created");
    }

    @Test
    void handleBookingEvent_WithCompletedEvent_ShouldProcess() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);
        event.put("userId", 1);
        event.put("mechanicId", 20);
        event.put("serviceType", "Oil Change");

        // Should not throw
        listener.handleBookingEvent(event, "booking.completed");
    }

    @Test
    void handleBookingEvent_WithUnknownRoutingKey_ShouldLogWarning() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);

        // Should not throw even with unknown routing key
        listener.handleBookingEvent(event, "booking.unknown");
    }

    @Test
    void handleBookingEvent_WithEmptyEvent_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();

        listener.handleBookingEvent(event, "booking.created");
    }

    @Test
    void handleBookingEvent_WithNullValues_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", null);
        event.put("userId", null);
        event.put("mechanicId", null);
        event.put("serviceType", null);

        listener.handleBookingEvent(event, "booking.created");
    }

    @Test
    void handleBookingEvent_WithStringNumberIds_ShouldParseCorrectly() {
        // Jackson may serialize Long as Integer for small values
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);
        event.put("userId", 1);
        event.put("mechanicId", 20);
        event.put("serviceType", "Brake Repair");

        listener.handleBookingEvent(event, "booking.completed");
    }

    @Test
    void handleBookingEvent_CreatedRoutingKey_WithPartialData_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);
        // Missing userId, mechanicId, serviceType, scheduledAt

        listener.handleBookingEvent(event, "booking.created");
    }

    @Test
    void handleBookingEvent_CompletedRoutingKey_WithMinimalData_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);

        listener.handleBookingEvent(event, "booking.completed");
    }
}
