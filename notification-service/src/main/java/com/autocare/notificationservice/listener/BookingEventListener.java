package com.autocare.notificationservice.listener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RabbitListener(queues = "notification.queue")
public class BookingEventListener {

    private static final Logger log = LoggerFactory.getLogger(BookingEventListener.class);

    @RabbitHandler
    public void handleBookingEvent(
            Map<String, Object> event,
            @Header("amqp_receivedRoutingKey") String routingKey) {

        switch (routingKey) {
            case "booking.created" -> {
                Long bookingId = getLong(event, "bookingId");
                Long userId = getLong(event, "userId");
                Long mechanicId = getLong(event, "mechanicId");
                String serviceType = getString(event, "serviceType");

                log.info("📅 [BOOKING CREATED] Booking #{} | User: {} | Mechanic: {} | Service: {}",
                        bookingId, userId, mechanicId, serviceType);

                // In a real application, this would send an email/SMS/push notification
                sendNotification("User #" + userId,
                        "Your booking #" + bookingId + " for " + serviceType + " has been created!");
            }
            case "booking.completed" -> {
                Long bookingId = getLong(event, "bookingId");
                Long userId = getLong(event, "userId");
                Long mechanicId = getLong(event, "mechanicId");
                String serviceType = getString(event, "serviceType");

                log.info("✅ [BOOKING COMPLETED] Booking #{} | User: {} | Mechanic: {} | Service: {}",
                        bookingId, userId, mechanicId, serviceType);

                sendNotification("User #" + userId,
                        "Your booking #" + bookingId + " for " + serviceType + " is complete! Rate your mechanic.");
            }
            default ->
                log.warn("⚠️ Unknown booking event type: {}", routingKey);
        }
    }

    /**
     * Simulates sending a push notification / email / SMS.
     */
    private void sendNotification(String recipient, String message) {
        log.info("📬 [NOTIFICATION TO {}] {}", recipient, message);
    }

    // --- Helper methods ---

    private Long getLong(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n) return n.longValue();
        return null;
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }
}
