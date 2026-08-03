package com.autocare.notificationservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.listener.SimpleMessageListenerContainer;
import org.springframework.amqp.rabbit.listener.adapter.MessageListenerAdapter;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String TOPIC_EXCHANGE_NAME = "autocare.events";
    public static final String QUEUE_NOTIFICATIONS = "notification.queue";
    public static final String ROUTING_KEY_BOOKING_CREATED = "booking.created";
    public static final String ROUTING_KEY_BOOKING_COMPLETED = "booking.completed";

    /**
     * Declare the same topic exchange that booking-service publishes to.
     */
    @Bean
    public TopicExchange autocareEventsExchange() {
        return new TopicExchange(TOPIC_EXCHANGE_NAME);
    }

    /**
     * Queue for all booking-related notifications.
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
     * JSON message converter so we can deserialize events from the booking-service.
     */
    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
