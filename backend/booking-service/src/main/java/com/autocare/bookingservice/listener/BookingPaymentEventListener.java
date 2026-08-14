package com.autocare.bookingservice.listener;

import com.autocare.bookingservice.config.RabbitMQConfig;
import com.autocare.bookingservice.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Drives the booking payment lifecycle from payment-service events:
 *
 * <pre>
 *   payment.initiated  → booking COMPLETED → PAYMENT_PENDING
 *   payment.success    → booking PAYMENT_PENDING → PAID (+ commission split)
 *   payment.failed     → booking PAYMENT_PENDING → COMPLETED (retry)
 * </pre>
 *
 * <p>All handlers are idempotent and only touch BOOKING-referenced payments,
 * so spare-part transactions never affect bookings.</p>
 */
@Component
@RabbitListener(queues = RabbitMQConfig.QUEUE_BOOKING_PAYMENTS,
        containerFactory = "paymentListenerContainerFactory")
public class BookingPaymentEventListener {

    private static final Logger log = LoggerFactory.getLogger(BookingPaymentEventListener.class);

    private final BookingService bookingService;

    public BookingPaymentEventListener(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @RabbitHandler
    public void onPaymentEvent(
            Map<String, Object> event,
            @Header("amqp_receivedRoutingKey") String routingKey) {

        String referenceType = string(event, "referenceType");
        if (!"BOOKING".equalsIgnoreCase(referenceType)) {
            return; // spare-part transactions are not our concern
        }

        Long bookingId = number(event, "referenceId");
        if (bookingId == null) {
            log.warn("⚠️ Payment event without a booking referenceId — ignoring");
            return;
        }

        try {
            switch (routingKey) {
                case RabbitMQConfig.ROUTING_KEY_PAYMENT_INITIATED -> {
                    bookingService.markPaymentInitiated(bookingId);
                    log.info("💳 Booking #{} moved to PAYMENT_PENDING", bookingId);
                }
                case RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS -> {
                    Long paymentId = number(event, "transactionId");
                    Long payerUserId = number(event, "userId");
                    BigDecimal paidAmount = decimal(event, "amount");
                    bookingService.markPaid(bookingId, paymentId, payerUserId, paidAmount);
                    log.info("✅ Booking #{} paid (transaction #{}) — commission & earnings recorded", bookingId, paymentId);
                }
                case RabbitMQConfig.ROUTING_KEY_PAYMENT_FAILED -> {
                    bookingService.revertToCompleted(bookingId);
                    log.info("❌ Payment for booking #{} failed — reverted to COMPLETED for retry", bookingId);
                }
                default -> log.warn("⚠️ Unknown payment routing key: {}", routingKey);
            }
        } catch (Exception e) {
            // Business exceptions are logged and acknowledged — never requeued —
            // so a single bad event cannot block the whole payment queue.
            log.error("⚠️ Failed to handle payment event {} for booking #{}: {}",
                    routingKey, bookingId, e.getMessage(), e);
        }
    }

    private Long number(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n) {
            return n.longValue();
        }
        if (val instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private String string(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private BigDecimal decimal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof BigDecimal bd) {
            return bd;
        }
        if (val instanceof Number n) {
            return new BigDecimal(n.toString());
        }
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
