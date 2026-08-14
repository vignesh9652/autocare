package com.autocare.notificationservice.listener;

import com.autocare.notificationservice.config.RabbitMQConfig;
import com.autocare.notificationservice.service.NotificationStore;
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

    private final NotificationStore notificationStore;

    public NotificationEventListener(NotificationStore notificationStore) {
        this.notificationStore = notificationStore;
    }

    @RabbitHandler
    public void handleNotificationEvent(
            Map<String, Object> event,
            @Header("amqp_receivedRoutingKey") String routingKey) {

        switch (routingKey) {
            case RabbitMQConfig.ROUTING_KEY_BOOKING_CREATED -> {
                Long bookingId = getLong(event, "bookingId");
                Long userId = getLong(event, "userId");
                Long mechanicId = getLong(event, "mechanicId");
                Long mechanicUserId = getLong(event, "mechanicUserId");
                String serviceType = getString(event, "serviceType");

                log.info("📅 [BOOKING CREATED] Booking #{} | User: {} | Mechanic: {} | Service: {}",
                        bookingId, userId, mechanicId, serviceType);

                if (userId != null) {
                    notificationStore.add(
                            userId,
                            "BOOKING_CREATED",
                            "Booking confirmed",
                            "Your booking #" + bookingId + " for " + serviceType + " has been created. "
                                    + (mechanicId != null ? "Your selected mechanic has been notified." : "A mechanic has been assigned."));
                }
                // Deliver the job request to the chosen mechanic's account. When
                // the mechanic's user id is unresolved (legacy auto-assign events),
                // fall back to the mechanic profile id.
                if (mechanicId != null) {
                    Long target = mechanicUserId != null ? mechanicUserId : mechanicId;
                    notificationStore.add(
                            target,
                            "NEW_JOB_ASSIGNED",
                            "New job request",
                            "You have a new job request: " + serviceType + " (booking #" + bookingId + "). Accept or reject it in Assigned Jobs.");
                }
            }
            case RabbitMQConfig.ROUTING_KEY_BOOKING_COMPLETED -> {
                Long bookingId = getLong(event, "bookingId");
                Long userId = getLong(event, "userId");
                String serviceType = getString(event, "serviceType");

                log.info("✅ [BOOKING COMPLETED] Booking #{} | User: {} | Service: {}",
                        bookingId, userId, serviceType);

                if (userId != null) {
                    notificationStore.add(
                            userId,
                            "BOOKING_COMPLETED",
                            "Service completed",
                            "Your booking #" + bookingId + " for " + serviceType + " is complete! Rate your mechanic.");
                }
            }
            case RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS -> {
                Long transactionId = getLong(event, "transactionId");
                String referenceType = getString(event, "referenceType");
                Long referenceId = getLong(event, "referenceId");
                BigDecimal amount = getBigDecimal(event, "amount");

                log.info("💳 [PAYMENT SUCCESS] Transaction #{} | {} #{} | Amount: {}",
                        transactionId, referenceType, referenceId, amount);

                Long userId = getLong(event, "userId");
                notificationStore.add(
                        userId != null ? userId : 0L,
                        "PAYMENT_SUCCESS",
                        "Payment successful",
                        "Your payment of ₹" + amount + " for " + referenceLabel(referenceType, referenceId) + " was successful!");
            }
            case RabbitMQConfig.ROUTING_KEY_PAYMENT_FAILED -> {
                Long transactionId = getLong(event, "transactionId");
                String referenceType = getString(event, "referenceType");
                Long referenceId = getLong(event, "referenceId");
                BigDecimal amount = getBigDecimal(event, "amount");

                log.info("❌ [PAYMENT FAILED] Transaction #{} | {} #{} | Amount: {}",
                        transactionId, referenceType, referenceId, amount);

                Long userId = getLong(event, "userId");
                notificationStore.add(
                        userId != null ? userId : 0L,
                        "PAYMENT_FAILED",
                        "Payment failed",
                        "Your payment of ₹" + amount + " for " + referenceLabel(referenceType, referenceId) + " failed. Please try again.");
            }
            case RabbitMQConfig.ROUTING_KEY_ADDITIONAL_SERVICE_REQUESTED -> {
                Long bookingId = getLong(event, "bookingId");
                Long customerId = getLong(event, "customerId");
                String serviceName = getString(event, "serviceName");
                String reason = getString(event, "reason");
                BigDecimal amount = getBigDecimal(event, "amount");
                BigDecimal newTotal = getBigDecimal(event, "newTotal");

                log.info("🔧 [ADDITIONAL SERVICE REQUESTED] Booking #{} | Service: {} | Amount: {}",
                        bookingId, serviceName, amount);

                if (customerId != null) {
                    notificationStore.add(
                            customerId,
                            "ADDITIONAL_SERVICE",
                            "Additional service requires your approval",
                            "Your mechanic found an additional issue and recommends " + serviceName
                                    + " (₹" + amount + ") for booking #" + bookingId
                                    + (reason != null ? ". Reason: " + reason : "")
                                    + ". New estimated total: ₹" + newTotal
                                    + ". Your approval is required before this work is performed.");
                }
            }
            case RabbitMQConfig.ROUTING_KEY_ADDITIONAL_SERVICE_APPROVED -> {
                Long bookingId = getLong(event, "bookingId");
                Long mechanicUserId = getLong(event, "mechanicUserId");
                String serviceName = getString(event, "serviceName");
                BigDecimal amount = getBigDecimal(event, "amount");

                log.info("✅ [ADDITIONAL SERVICE APPROVED] Booking #{} | Service: {}",
                        bookingId, serviceName);

                if (mechanicUserId != null) {
                    notificationStore.add(
                            mechanicUserId,
                            "ADDITIONAL_SERVICE",
                            "Customer approved additional service",
                            "The customer approved " + serviceName + " (₹" + amount
                                    + ") for booking #" + bookingId + ". You can now perform this service.");
                }
            }
            case RabbitMQConfig.ROUTING_KEY_ADDITIONAL_SERVICE_REJECTED -> {
                Long bookingId = getLong(event, "bookingId");
                Long mechanicUserId = getLong(event, "mechanicUserId");
                String serviceName = getString(event, "serviceName");
                BigDecimal amount = getBigDecimal(event, "amount");

                log.info("❌ [ADDITIONAL SERVICE REJECTED] Booking #{} | Service: {}",
                        bookingId, serviceName);

                if (mechanicUserId != null) {
                    notificationStore.add(
                            mechanicUserId,
                            "ADDITIONAL_SERVICE",
                            "Customer rejected additional service",
                            "The customer rejected " + serviceName + " (₹" + amount
                                    + ") for booking #" + bookingId + ". Do not perform this service.");
                }
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
