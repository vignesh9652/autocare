package com.autocare.sparepartsservice.listener;

import com.autocare.sparepartsservice.config.RabbitMQConfig;
import com.autocare.sparepartsservice.service.SparePartOrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Consumes payment events so spare-part orders can be marked PAID the moment
 * the customer's payment succeeds (or left PENDING on failure for a retry).
 */
@Component
@RabbitListener(queues = RabbitMQConfig.ORDER_PAYMENT_QUEUE)
public class OrderPaymentEventListener {

    private static final Logger log = LoggerFactory.getLogger(OrderPaymentEventListener.class);

    private final SparePartOrderService orderService;

    public OrderPaymentEventListener(SparePartOrderService orderService) {
        this.orderService = orderService;
    }

    @RabbitHandler
    public void handlePaymentEvent(
            Map<String, Object> event,
            @Header("amqp_receivedRoutingKey") String routingKey) {

        String referenceType = asString(event.get("referenceType"));
        Long referenceId = asLong(event.get("referenceId"));
        Long userId = asLong(event.get("userId"));

        // Only spare-part payments are relevant to this service.
        if (referenceId == null || !"SPARE_PART".equalsIgnoreCase(referenceType)) {
            return;
        }

        switch (routingKey) {
            case RabbitMQConfig.ROUTING_KEY_PAYMENT_SUCCESS -> {
                log.info("✅ [PAYMENT SUCCESS] order #{} — marking PAID", referenceId);
                orderService.markPaid(referenceId, userId);
            }
            case RabbitMQConfig.ROUTING_KEY_PAYMENT_FAILED -> {
                // Order stays PENDING; the customer can retry payment.
                log.info("❌ [PAYMENT FAILED] order #{} — payment pending, retry allowed", referenceId);
            }
            default -> log.warn("⚠️ Unknown routing key: {}", routingKey);
        }
    }

    private Long asLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        if (value instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private String asString(Object value) {
        return value != null ? value.toString() : null;
    }
}
