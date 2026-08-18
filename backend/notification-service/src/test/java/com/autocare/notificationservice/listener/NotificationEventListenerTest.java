package com.autocare.notificationservice.listener;

import com.autocare.notificationservice.model.Notification;
import com.autocare.notificationservice.service.NotificationStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
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

    @Test
    void handleEvent_WalletMechanicCredited_ShouldNotifyTheMechanicUser() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("mechanicId", 20);
        event.put("mechanicUserId", 3);
        event.put("bookingId", 100);
        event.put("paymentId", 777);
        event.put("amount", new BigDecimal("850.00"));
        event.put("balance", new BigDecimal("3500.00"));

        listener.handleNotificationEvent(event, "wallet.mechanic-credited");

        List<Notification> notifications = store.findByUserId(3L);
        assertEquals(1, notifications.size());
        assertEquals("WALLET_CREDIT", notifications.get(0).getType());
        assertEquals("Money added to your wallet", notifications.get(0).getTitle());
        assertTrue(notifications.get(0).getMessage().contains("850"));
        assertTrue(notifications.get(0).getMessage().contains("booking #100"));
        assertTrue(notifications.get(0).getMessage().contains("3500"));
    }

    @Test
    void handleEvent_WalletMechanicCredited_WithoutUserId_ShouldFallBackToMechanicId() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("mechanicId", 20);
        // No mechanicUserId (booking predates the field) → fall back to profile id
        event.put("bookingId", 100);
        event.put("amount", new BigDecimal("850.00"));
        event.put("balance", new BigDecimal("3500.00"));

        listener.handleNotificationEvent(event, "wallet.mechanic-credited");

        List<Notification> notifications = store.findByUserId(20L);
        assertEquals(1, notifications.size());
        assertEquals("WALLET_CREDIT", notifications.get(0).getType());
    }

    @Test
    void handleEvent_WalletMechanicCredited_WithoutMechanic_ShouldNotNotify() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 100);
        event.put("amount", new BigDecimal("850.00"));

        listener.handleNotificationEvent(event, "wallet.mechanic-credited");

        assertTrue(store.findAll().isEmpty());
    }

    @Test
    void handleEvent_WithdrawalApproved_ShouldNotifyTheMechanic() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("withdrawalId", 9);
        event.put("mechanicId", 20);
        event.put("mechanicUserId", 3);
        event.put("amount", new BigDecimal("5000.00"));
        event.put("status", "APPROVED");
        event.put("balance", new BigDecimal("3500.00"));

        listener.handleNotificationEvent(event, "withdrawal.processed");

        List<Notification> notifications = store.findByUserId(3L);
        assertEquals(1, notifications.size());
        assertEquals("WITHDRAWAL", notifications.get(0).getType());
        assertEquals("Withdrawal approved", notifications.get(0).getTitle());
        assertTrue(notifications.get(0).getMessage().contains("5000"));
        assertTrue(notifications.get(0).getMessage().contains("3500"));
    }

    @Test
    void handleEvent_WithdrawalRejected_ShouldNotifyTheMechanic() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("withdrawalId", 9);
        event.put("mechanicId", 20);
        event.put("mechanicUserId", 3);
        event.put("amount", new BigDecimal("5000.00"));
        event.put("status", "REJECTED");
        event.put("balance", new BigDecimal("8500.00"));

        listener.handleNotificationEvent(event, "withdrawal.processed");

        List<Notification> notifications = store.findByUserId(3L);
        assertEquals(1, notifications.size());
        assertEquals("WITHDRAWAL", notifications.get(0).getType());
        assertEquals("Withdrawal rejected", notifications.get(0).getTitle());
        assertTrue(notifications.get(0).getMessage().contains("5000"));
        assertTrue(notifications.get(0).getMessage().contains("8500"));
    }

    @Test
    void handleEvent_WithdrawalProcessed_WithoutUserId_ShouldFallBackToMechanicId() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("withdrawalId", 9);
        event.put("mechanicId", 20);
        event.put("amount", new BigDecimal("5000.00"));
        event.put("status", "APPROVED");
        event.put("balance", new BigDecimal("3500.00"));

        listener.handleNotificationEvent(event, "withdrawal.processed");

        List<Notification> notifications = store.findByUserId(20L);
        assertEquals(1, notifications.size());
        assertEquals("WITHDRAWAL", notifications.get(0).getType());
    }

    @Test
    void handleEvent_WithdrawalProcessed_UnknownStatus_ShouldNotNotify() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("withdrawalId", 9);
        event.put("mechanicId", 20);
        event.put("amount", new BigDecimal("5000.00"));
        event.put("status", "PAID");

        listener.handleNotificationEvent(event, "withdrawal.processed");

        assertTrue(store.findAll().isEmpty());
    }

    // ─── Booking status changes ────────────────────────────────────────────

    @Test
    void handleEvent_StatusChangedAccepted_ShouldNotifyTheCustomer() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 101);
        event.put("userId", 1);
        event.put("mechanicId", 20);
        event.put("serviceType", "SPARE_PART_INSTALLATION");
        event.put("newStatus", "ACCEPTED");

        listener.handleNotificationEvent(event, "booking.status-changed");

        List<Notification> notifications = store.findByUserId(1L);
        assertEquals(1, notifications.size());
        assertEquals("BOOKING_ACCEPTED", notifications.get(0).getType());
        assertTrue(notifications.get(0).getMessage().contains("installation request"));
    }

    @Test
    void handleEvent_StatusChangedRejected_ShouldNotifyTheCustomer() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 101);
        event.put("userId", 1);
        event.put("mechanicId", 20);
        event.put("serviceType", "General Service");
        event.put("newStatus", "REJECTED");

        listener.handleNotificationEvent(event, "booking.status-changed");

        List<Notification> notifications = store.findByUserId(1L);
        assertEquals(1, notifications.size());
        assertEquals("BOOKING_REJECTED", notifications.get(0).getType());
    }

    @Test
    void handleEvent_StatusChangedStarted_ShouldNotifyTheCustomer() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 101);
        event.put("userId", 1);
        event.put("serviceType", "SPARE_PART_INSTALLATION");
        event.put("newStatus", "IN_PROGRESS");

        listener.handleNotificationEvent(event, "booking.status-changed");

        List<Notification> notifications = store.findByUserId(1L);
        assertEquals(1, notifications.size());
        assertTrue(notifications.get(0).getMessage().contains("installation"));
    }

    @Test
    void handleEvent_StatusChangedCancelled_ShouldNotifyTheMechanic() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("bookingId", 101);
        event.put("userId", 1);
        event.put("mechanicId", 20);
        event.put("mechanicUserId", 3);
        event.put("serviceType", "General Service");
        event.put("newStatus", "CANCELLED");

        listener.handleNotificationEvent(event, "booking.status-changed");

        List<Notification> notifications = store.findByUserId(3L);
        assertEquals(1, notifications.size());
        assertEquals("BOOKING_CANCELLED", notifications.get(0).getType());
        assertTrue(notifications.get(0).getMessage().contains("cancelled"));
    }

    // ─── Spare part order delivered ────────────────────────────────────────

    @Test
    void handleEvent_OrderDelivered_ShouldNotifyTheCustomer() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("orderId", 42);
        event.put("userId", 1);

        listener.handleNotificationEvent(event, "spare-part-order.delivered");

        List<Notification> notifications = store.findByUserId(1L);
        assertEquals(1, notifications.size());
        assertEquals("ORDER_DELIVERED", notifications.get(0).getType());
        assertTrue(notifications.get(0).getMessage().contains("#42"));
    }

    @Test
    void handleEvent_OrderDelivered_WithoutUserId_ShouldNotNotify() {
        NotificationStore store = new NotificationStore();
        NotificationEventListener listener = new NotificationEventListener(store);
        Map<String, Object> event = new HashMap<>();
        event.put("orderId", 42);

        listener.handleNotificationEvent(event, "spare-part-order.delivered");

        assertTrue(store.findAll().isEmpty());
    }
}
