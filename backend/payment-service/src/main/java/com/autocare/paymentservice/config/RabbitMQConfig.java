package com.autocare.paymentservice.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String TOPIC_EXCHANGE_NAME = "autocare.events";
    public static final String ROUTING_KEY_PAYMENT_SUCCESS = "payment.success";
    public static final String ROUTING_KEY_PAYMENT_FAILED = "payment.failed";

    /**
     * Declare the same topic exchange used by booking-service. RabbitAdmin
     * re-declaration of an existing exchange with the same name/type is
     * idempotent and safe across services.
     */
    @Bean
    public TopicExchange autocareEventsExchange() {
        return new TopicExchange(TOPIC_EXCHANGE_NAME);
    }

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Configure RabbitTemplate to use JSON message converter.
     * Disables the {@code __TypeId__} header so notification-service (which
     * does not have our event DTOs on its classpath) can deserialize the
     * payloads into a {@code Map} without a ClassNotFoundException.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                          Jackson2JsonMessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        converter.setTypePrecedence(
                org.springframework.amqp.support.converter.Jackson2JavaTypeMapper.TypePrecedence.INFERRED);
        template.setMessageConverter(converter);
        return template;
    }
}
