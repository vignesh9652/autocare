package com.autocare.notificationservice.listener;

import com.autocare.notificationservice.service.NotificationStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit test for NotificationEventListener.
 * Tests that the listener correctly handles different event types
 * by verifying it doesn't throw exceptions and processes events gracefully.
 */
@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    private NotificationEventListener listener;

    @BeforeEach
    void setUp() {
        listener = new NotificationEventListener(new NotificationStore());
    }

    @Test
    void handleEvent_WithBookingCreatedEvent_ShouldProcess() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);
        event.put("userId", 1);
        event.put("mechanicId", 20);
        event.put("serviceType", "Oil Change");
        event.put("scheduledAt", "2026-08-01T10:00:00");

        // Should not throw
        listener.handleNotificationEvent(event, "booking.created");
    }

    @Test
    void handleEvent_WithBookingCompletedEvent_ShouldProcess() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);
        event.put("userId", 1);
        event.put("mechanicId", 20);
        event.put("serviceType", "Oil Change");

        // Should not throw
        listener.handleNotificationEvent(event, "booking.completed");
    }

    @Test
    void handleEvent_WithPaymentSuccessEvent_ShouldProcess() {
        Map<String, Object> event = new HashMap<>();
        event.put("transactionId", 1);
        event.put("referenceType", "BOOKING");
        event.put("referenceId", 100);
        event.put("amount", 1500.00);

        // Should not throw
        listener.handleNotificationEvent(event, "payment.success");
    }

    @Test
    void handleEvent_WithPaymentFailedEvent_ShouldProcess() {
        Map<String, Object> event = new HashMap<>();
        event.put("transactionId", 2);
        event.put("referenceType", "SPARE_PART");
        event.put("referenceId", 5);
        event.put("amount", 89.99);

        // Should not throw
        listener.handleNotificationEvent(event, "payment.failed");
    }

    @Test
    void handleEvent_PaymentEvent_WithAmountAsString_ShouldNotThrow() {
        // Jackson may deliver numbers as BigDecimal, Integer or String
        Map<String, Object> event = new HashMap<>();
        event.put("transactionId", 1);
        event.put("referenceType", "BOOKING");
        event.put("referenceId", 100);
        event.put("amount", "1500.00");

        listener.handleNotificationEvent(event, "payment.success");
    }

    @Test
    void handleEvent_PaymentEvent_WithAmountAsBigDecimal_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();
        event.put("transactionId", 1);
        event.put("referenceType", "SPARE_PART");
        event.put("referenceId", 100);
        event.put("amount", BigDecimal.valueOf(1500.00));

        listener.handleNotificationEvent(event, "payment.failed");
    }

    @Test
    void handleEvent_WithUnknownRoutingKey_ShouldLogWarning() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);

        // Should not throw even with unknown routing key
        listener.handleNotificationEvent(event, "booking.unknown");
    }

    @Test
    void handleEvent_WithEmptyEvent_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();

        listener.handleNotificationEvent(event, "booking.created");
    }

    @Test
    void handleEvent_WithNullValues_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", null);
        event.put("userId", null);
        event.put("mechanicId", null);
        event.put("serviceType", null);

        listener.handleNotificationEvent(event, "booking.created");
    }

    @Test
    void handleEvent_WithStringNumberIds_ShouldParseCorrectly() {
        // Jackson may serialize Long as Integer for small values
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);
        event.put("userId", 1);
        event.put("mechanicId", 20);
        event.put("serviceType", "Brake Repair");

        listener.handleNotificationEvent(event, "booking.completed");
    }

    @Test
    void handleEvent_CreatedRoutingKey_WithPartialData_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);
        // Missing userId, mechanicId, serviceType, scheduledAt

        listener.handleNotificationEvent(event, "booking.created");
    }

    @Test
    void handleEvent_CompletedRoutingKey_WithMinimalData_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);

        listener.handleNotificationEvent(event, "booking.completed");
    }

    @Test
    void handleEvent_PaymentRoutingKey_WithMinimalData_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();
        event.put("transactionId", 1);

        listener.handleNotificationEvent(event, "payment.success");
    }

    @Test
    void handleEvent_PaymentEvent_WithMissingReference_ShouldNotThrow() {
        Map<String, Object> event = new HashMap<>();
        event.put("transactionId", 1);
        event.put("referenceType", null);
        event.put("referenceId", null);
        event.put("amount", 100.00);

        listener.handleNotificationEvent(event, "payment.failed");
    }
}
