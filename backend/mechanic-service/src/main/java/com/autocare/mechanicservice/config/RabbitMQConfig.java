package com.autocare.mechanicservice.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.*;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.util.Map;

/**
 * Consumes the {@code booking.paid} event published by booking-service so a
 * mechanic's earning can be recorded the moment a customer pays a booking.
 */
@Configuration
public class RabbitMQConfig {

    public static final String TOPIC_EXCHANGE_NAME = "autocare.events";
    public static final String ROUTING_KEY_BOOKING_PAID = "booking.paid";
    public static final String QUEUE_MECHANIC_EARNINGS = "mechanic.earning.queue";

    @Bean
    public TopicExchange autocareEventsExchange() {
        return new TopicExchange(TOPIC_EXCHANGE_NAME);
    }

    @Bean
    public Queue mechanicEarningQueue() {
        return new Queue(QUEUE_MECHANIC_EARNINGS, true);
    }

    @Bean
    public Binding bookingPaidBinding(Queue mechanicEarningQueue, TopicExchange exchange) {
        return BindingBuilder.bind(mechanicEarningQueue).to(exchange).with(ROUTING_KEY_BOOKING_PAID);
    }

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        return new RabbitAdmin(connectionFactory);
    }

    /**
     * booking-service attaches a {@code __TypeId__} header referencing its own
     * DTO class, so we always deserialize into a {@code Map<String, Object>} —
     * exactly the shape the listener expects.
     */
    @Bean
    public Jackson2JsonMessageConverter earningEventsConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        return new Jackson2JsonMessageConverter() {
            @Override
            public Object fromMessage(Message message) throws MessageConversionException {
                try {
                    return objectMapper.readValue(
                            message.getBody(), new TypeReference<Map<String, Object>>() {
                            });
                } catch (IOException e) {
                    throw new MessageConversionException("Failed to convert booking.paid event", e);
                }
            }
        };
    }

    @Bean
    public SimpleRabbitListenerContainerFactory earningListenerContainerFactory(
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter earningEventsConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(earningEventsConverter);
        return factory;
    }
}
