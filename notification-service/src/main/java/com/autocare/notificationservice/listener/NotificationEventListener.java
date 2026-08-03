package com.autocare.notificationservice.listener;

import com.autocare.notificationservice.config.RabbitMQConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
@RabbitListener(queues = "notification.queue")
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    @RabbitHandler
    public void handleNotificationEvent(
            Map<String, Object> event,
            @Header("amqp_receivedRoutingKey") String routingKey) {

        switch (routingKey) {
            case RabbitMQConfig.ROUTING_KEY_BOOKING_CREATED -> {
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
            case RabbitMQConfig.ROUTING_KEY_BOOKING_COMPLETED -> {
                Long bookingId = getLong(event, "bookingId");
                Long userId = getLong(event, "userId");
                Long mechanicId = getLong(event, "mechanicId");
                String serviceType = getString(event, "serviceType");

                log.info("✅ [BOOKING COMPLETED] Booking #{} | User: {} | Mechanic: {} | Service: {}",
                        bookingId, userId, mechanicId, serviceType);

                sendNotification("User #" + userId,
                        "Your booking #" + bookingId + " for " + serviceType + " is complete! Rate your mechanic.");
            }
            case RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS -> {
                Long transactionId = getLong(event, "transactionId");
                String referenceType = getString(event, "referenceType");
                Long referenceId = getLong(event, "referenceId");
                BigDecimal amount = getBigDecimal(event, "amount");

                log.info("💳 [PAYMENT SUCCESS] Transaction #{} | {} #{} | Amount: {}",
                        transactionId, referenceType, referenceId, amount);

                sendNotification("Payment received",
                        "Your payment of ₹" + amount + " for " + referenceLabel(referenceType, referenceId) + " was successful!");
            }
            case RabbitMQConfig.ROUTING_KEY_PAYMENT_FAILED -> {
                Long transactionId = getLong(event, "transactionId");
                String referenceType = getString(event, "referenceType");
                Long referenceId = getLong(event, "referenceId");
                BigDecimal amount = getBigDecimal(event, "amount");

                log.info("❌ [PAYMENT FAILED] Transaction #{} | {} #{} | Amount: {}",
                        transactionId, referenceType, referenceId, amount);

                sendNotification("Payment failed",
                        "Your payment of ₹" + amount + " for " + referenceLabel(referenceType, referenceId) + " failed. Please try again.");
            }
            default ->
                log.warn("⚠️ Unknown notification event type: {}", routingKey);
        }
    }

    private String referenceLabel(String referenceType, Long referenceId) {
        if (referenceType == null || referenceId == null) {
            return "your order";
        }
        return switch (referenceType.toUpperCase()) {
            case "BOOKING" -> "booking #" + referenceId;
            case "SPARE_PART" -> "spare part order #" + referenceId;
            default -> "reference #" + referenceId;
        };
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
        if (val instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof BigDecimal bd) return bd;
        if (val instanceof Number n) return new BigDecimal(n.toString());
        if (val instanceof String s) {
            try {
                return new BigDecimal(s);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
