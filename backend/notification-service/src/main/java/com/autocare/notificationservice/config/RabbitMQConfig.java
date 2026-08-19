package com.autocare.notificationservice.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.*;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String TOPIC_EXCHANGE_NAME = "autocare.events";
    public static final String QUEUE_NOTIFICATIONS = "notification.queue";
    public static final String ROUTING_KEY_BOOKING_CREATED = "booking.created";
    public static final String ROUTING_KEY_BOOKING_COMPLETED = "booking.completed";
    public static final String ROUTING_KEY_PAYMENT_SUCCESS = "payment.success";
    public static final String ROUTING_KEY_PAYMENT_FAILED = "payment.failed";
    public static final String ROUTING_KEY_ADDITIONAL_SERVICE_REQUESTED = "additional-service.requested";
    public static final String ROUTING_KEY_ADDITIONAL_SERVICE_APPROVED = "additional-service.approved";
    public static final String ROUTING_KEY_ADDITIONAL_SERVICE_REJECTED = "additional-service.rejected";
    public static final String ROUTING_KEY_WALLET_MECHANIC_CREDITED = "wallet.mechanic-credited";
    public static final String ROUTING_KEY_WITHDRAWAL_PROCESSED = "withdrawal.processed";
    public static final String ROUTING_KEY_BOOKING_STATUS_CHANGED = "booking.status-changed";
    public static final String ROUTING_KEY_ORDER_DELIVERED = "spare-part-order.delivered";

    /**
     * Declare the same topic exchange that booking-service and payment-service
     * publish to.
     */
    @Bean
    public TopicExchange autocareEventsExchange() {
        return new TopicExchange(TOPIC_EXCHANGE_NAME);
    }

    /**
     * Queue for all notification events.
     */
    @Bean
    public Queue notificationQueue() {
        return new Queue(QUEUE_NOTIFICATIONS, true);
    }

    /**
     * Bind the queue to receive booking.created events.
     */
    @Bean
    public Binding bookingCreatedBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_BOOKING_CREATED);
    }

    /**
     * Bind the queue to receive booking.completed events.
     */
    @Bean
    public Binding bookingCompletedBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_BOOKING_COMPLETED);
    }

    /**
     * Bind the queue to receive payment.success events.
     */
    @Bean
    public Binding paymentSuccessBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_PAYMENT_SUCCESS);
    }

    /**
     * Bind the queue to receive payment.failed events.
     */
    @Bean
    public Binding paymentFailedBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_PAYMENT_FAILED);
    }

    /**
     * Bind the queue to receive additional-service (inspection) events.
     */
    @Bean
    public Binding additionalServiceRequestedBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_ADDITIONAL_SERVICE_REQUESTED);
    }

    @Bean
    public Binding additionalServiceApprovedBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_ADDITIONAL_SERVICE_APPROVED);
    }

    @Bean
    public Binding additionalServiceRejectedBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_ADDITIONAL_SERVICE_REJECTED);
    }

    /**
     * Bind the queue to receive wallet-credit events so the mechanic can be
     * told when their earning lands in their wallet.
     */
    @Bean
    public Binding walletMechanicCreditedBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_WALLET_MECHANIC_CREDITED);
    }

    /**
     * Bind the queue to receive withdrawal decisions so the mechanic can be
     * told when their request is approved or rejected.
     */
    @Bean
    public Binding withdrawalProcessedBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_WITHDRAWAL_PROCESSED);
    }

    /**
     * Bind the queue to receive booking status transitions (accepted,
     * rejected, started, cancelled).
     */
    @Bean
    public Binding bookingStatusChangedBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_BOOKING_STATUS_CHANGED);
    }

    /**
     * Bind the queue to receive spare-part delivery events.
     */
    @Bean
    public Binding orderDeliveredBinding(Queue notificationQueue, TopicExchange exchange) {
        return BindingBuilder
                .bind(notificationQueue)
                .to(exchange)
                .with(ROUTING_KEY_ORDER_DELIVERED);
    }

    /**
     * RabbitAdmin ensures the exchange, queue, and bindings declared below
     * are created/exist when the connection is established.
     */
    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        return new RabbitAdmin(connectionFactory);
    }

    /**
     * JSON message converter for incoming events.
     *
     * Producers (booking-service, payment-service) attach a {@code __TypeId__}
     * header that references event DTO classes which do not exist on this
     * service's classpath, so the default type-mapper would fail with a
     * ClassNotFoundException. We therefore always deserialize the payload into
     * a {@code Map<String, Object>} - exactly the shape the @RabbitHandler
     * method expects - regardless of any type headers.
     */
    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        return new Jackson2JsonMessageConverter() {
            @Override
            public Object fromMessage(Message message) throws MessageConversionException {
                try {
                    return objectMapper.readValue(
                            message.getBody(), new TypeReference<Map<String, Object>>() {
                            });
                } catch (IOException e) {
                    throw new MessageConversionException("Failed to convert notification event", e);
                }
            }
        };
    }
}
