package com.autocare.bookingservice.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.*;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConversionException;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String TOPIC_EXCHANGE_NAME = "autocare.events";

    // Published by this service
    public static final String ROUTING_KEY_BOOKING_CREATED = "booking.created";
    public static final String ROUTING_KEY_BOOKING_COMPLETED = "booking.completed";
    public static final String ROUTING_KEY_BOOKING_PAID = "booking.paid";

    // Published by this service for the additional-service (inspection) flow
    public static final String ROUTING_KEY_ADDITIONAL_SERVICE_REQUESTED = "additional-service.requested";
    public static final String ROUTING_KEY_ADDITIONAL_SERVICE_APPROVED = "additional-service.approved";
    public static final String ROUTING_KEY_ADDITIONAL_SERVICE_REJECTED = "additional-service.rejected";

    // Consumed by this service (published by payment-service)
    public static final String ROUTING_KEY_PAYMENT_INITIATED = "payment.initiated";
    public static final String ROUTING_KEY_PAYMENT_SUCCESS = "payment.success";
    public static final String ROUTING_KEY_PAYMENT_FAILED = "payment.failed";

    public static final String QUEUE_BOOKING_PAYMENTS = "booking.payment.queue";

    @Bean
    public TopicExchange autocareEventsExchange() {
        return new TopicExchange(TOPIC_EXCHANGE_NAME);
    }

    /** Queue for payment lifecycle events consumed by booking-service. */
    @Bean
    public Queue bookingPaymentQueue() {
        return new Queue(QUEUE_BOOKING_PAYMENTS, true);
    }

    @Bean
    public Binding paymentInitiatedBinding(Queue bookingPaymentQueue, TopicExchange exchange) {
        return BindingBuilder.bind(bookingPaymentQueue).to(exchange).with(ROUTING_KEY_PAYMENT_INITIATED);
    }

    @Bean
    public Binding paymentSuccessBinding(Queue bookingPaymentQueue, TopicExchange exchange) {
        return BindingBuilder.bind(bookingPaymentQueue).to(exchange).with(ROUTING_KEY_PAYMENT_SUCCESS);
    }

    @Bean
    public Binding paymentFailedBinding(Queue bookingPaymentQueue, TopicExchange exchange) {
        return BindingBuilder.bind(bookingPaymentQueue).to(exchange).with(ROUTING_KEY_PAYMENT_FAILED);
    }

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        return new RabbitAdmin(connectionFactory);
    }

    /**
     * JSON converter used by the producer {@link RabbitTemplate}. The type
     * precedence is INFERRED so published payloads carry no class-specific
     * type headers.
     */
    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();
        converter.setTypePrecedence(
                org.springframework.amqp.support.converter.Jackson2JavaTypeMapper.TypePrecedence.INFERRED);
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                         @org.springframework.beans.factory.annotation.Qualifier("jsonMessageConverter")
                                         Jackson2JsonMessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(converter);
        return template;
    }

    /**
     * Consumer-side converter for payment events. payment-service attaches a
     * {@code __TypeId__} header referencing DTO classes that are not on this
     * service's classpath, so we always deserialize into a {@code Map} —
     * exactly the shape the listener expects.
     */
    @Bean
    public Jackson2JsonMessageConverter paymentEventsConverter() {
        ObjectMapper objectMapper = new ObjectMapper();
        return new Jackson2JsonMessageConverter() {
            @Override
            public Object fromMessage(Message message) throws MessageConversionException {
                try {
                    return objectMapper.readValue(
                            message.getBody(), new TypeReference<Map<String, Object>>() {
                            });
                } catch (IOException e) {
                    throw new MessageConversionException("Failed to convert payment event", e);
                }
            }
        };
    }

    /** Listener container factory that uses the Map-deserializing converter. */
    @Bean
    public SimpleRabbitListenerContainerFactory paymentListenerContainerFactory(
            ConnectionFactory connectionFactory,
            @org.springframework.beans.factory.annotation.Qualifier("paymentEventsConverter")
            Jackson2JsonMessageConverter paymentEventsConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(paymentEventsConverter);
        return factory;
    }
}
