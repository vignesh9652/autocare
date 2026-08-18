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
            case RabbitMQConfig.ROUTING_KEY_WALLET_MECHANIC_CREDITED -> {
                Long mechanicId = getLong(event, "mechanicId");
                Long mechanicUserId = getLong(event, "mechanicUserId");
                Long bookingId = getLong(event, "bookingId");
                BigDecimal amount = getBigDecimal(event, "amount");
                BigDecimal balance = getBigDecimal(event, "balance");

                log.info("💰 [WALLET CREDIT] Mechanic #{} | Booking #{} | Credited: ₹{} | Balance: ₹{}",
                        mechanicId, bookingId, amount, balance);

                if (mechanicId != null) {
                    // Prefer the mechanic's user account; fall back to the
                    // profile id for bookings without a linked account.
                    Long target = mechanicUserId != null ? mechanicUserId : mechanicId;
                    notificationStore.add(
                            target,
                            "WALLET_CREDIT",
                            "Money added to your wallet",
                            "₹" + amount + " from booking #" + bookingId
                                    + " has been credited to your wallet. "
                                    + "Available balance: ₹" + balance + ".");
                }
            }
            case RabbitMQConfig.ROUTING_KEY_WITHDRAWAL_PROCESSED -> {
                Long withdrawalId = getLong(event, "withdrawalId");
                Long mechanicId = getLong(event, "mechanicId");
                Long mechanicUserId = getLong(event, "mechanicUserId");
                BigDecimal amount = getBigDecimal(event, "amount");
                String status = getString(event, "status");
                BigDecimal balance = getBigDecimal(event, "balance");

                log.info("🏧 [WITHDRAWAL PROCESSED] Request #{} | Mechanic #{} | {} | ₹{} | Balance: ₹{}",
                        withdrawalId, mechanicId, status, amount, balance);

                if (mechanicId != null && status != null) {
                    Long target = mechanicUserId != null ? mechanicUserId : mechanicId;
                    if ("APPROVED".equalsIgnoreCase(status)) {
                        notificationStore.add(
                                target,
                                "WITHDRAWAL",
                                "Withdrawal approved",
                                "Your withdrawal of ₹" + amount + " has been approved. "
                                        + "Available balance: ₹" + balance + ".");
                    } else if ("REJECTED".equalsIgnoreCase(status)) {
                        notificationStore.add(
                                target,
                                "WITHDRAWAL",
                                "Withdrawal rejected",
                                "Your withdrawal of ₹" + amount + " was not approved. "
                                        + "Available balance: ₹" + balance + ".");
                    }
                }
            }
            case RabbitMQConfig.ROUTING_KEY_BOOKING_STATUS_CHANGED -> {
                Long bookingId = getLong(event, "bookingId");
                Long userId = getLong(event, "userId");
                Long mechanicId = getLong(event, "mechanicId");
                Long mechanicUserId = getLong(event, "mechanicUserId");
                String serviceType = getString(event, "serviceType");
                String newStatus = getString(event, "newStatus");

                log.info("🔄 [BOOKING STATUS] Booking #{} | {} | New status: {}",
                        bookingId, serviceType, newStatus);

                if (newStatus == null) break;
                boolean installation = "SPARE_PART_INSTALLATION".equalsIgnoreCase(serviceType);
                String noun = installation ? "installation request" : "service request";

                switch (newStatus.toUpperCase()) {
                    case "ACCEPTED" -> {
                        if (userId != null) {
                            notificationStore.add(
                                    userId, "BOOKING_ACCEPTED", "Request accepted",
                                    "Your " + noun + " #" + bookingId + " has been accepted. "
                                            + "The mechanic will arrive at the scheduled time.");
                        }
                    }
                    case "REJECTED" -> {
                        if (userId != null) {
                            notificationStore.add(
                                    userId, "BOOKING_REJECTED", "Request declined",
                                    "Your " + noun + " #" + bookingId
                                            + " was declined by the mechanic. Please try booking again.");
                        }
                    }
                    case "IN_PROGRESS" -> {
                        if (userId != null) {
                            notificationStore.add(
                                    userId, "BOOKING_STARTED", "Work started",
                                    (installation ? "Your mechanic has started the spare-part installation"
                                            : "Your mechanic has started the service")
                                            + " for booking #" + bookingId + ".");
                        }
                    }
                    case "CANCELLED" -> {
                        if (mechanicId != null) {
                            Long target = mechanicUserId != null ? mechanicUserId : mechanicId;
                            notificationStore.add(
                                    target, "BOOKING_CANCELLED", "Booking cancelled",
                                    "The customer cancelled booking #" + bookingId
                                            + " (" + serviceType + ").");
                        }
                    }
                    default -> log.warn("⚠️ Unhandled booking status change: {}", newStatus);
                }
            }
            case RabbitMQConfig.ROUTING_KEY_ORDER_DELIVERED -> {
                Long orderId = getLong(event, "orderId");
                Long userId = getLong(event, "userId");

                log.info("🚚 [ORDER DELIVERED] Order #{} | User: {}", orderId, userId);

                if (userId != null && orderId != null) {
                    notificationStore.add(
                            userId,
                            "ORDER_DELIVERED",
                            "Spare part delivered",
                            "Your spare part order #" + orderId + " has been delivered. "
                                    + "You can now book a mechanic to install it if you haven't already.");
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
