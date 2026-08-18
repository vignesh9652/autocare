package com.autocare.sparepartsservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declares the shared {@code autocare.events} topic exchange and this
 * service's own queue for spare-part order events.
 *
 * <ul>
 *   <li>Consumes {@code payment.success} / {@code payment.failed} to mark
 *       orders paid.</li>
 *   <li>Publishes {@code spare-part-order.delivered} so the customer can be
 *       told when their part is ready for installation.</li>
 * </ul>
 */
@Configuration
public class RabbitMQConfig {

    public static final String TOPIC_EXCHANGE_NAME = "autocare.events";

    public static final String ROUTING_KEY_PAYMENT_SUCCESS = "payment.success";
    public static final String ROUTING_KEY_PAYMENT_FAILED = "payment.failed";

    public static final String ROUTING_KEY_ORDER_DELIVERED = "spare-part-order.delivered";

    public static final String ORDER_PAYMENT_QUEUE = "spareparts.order.queue";

    @Bean
    public TopicExchange autocareEventsExchange() {
        return new TopicExchange(TOPIC_EXCHANGE_NAME);
    }

    /** Orders wait here for the payment result. */
    @Bean
    public Queue orderPaymentQueue() {
        return new Queue(ORDER_PAYMENT_QUEUE, true);
    }

    @Bean
    public Binding paymentSuccessBinding(Queue orderPaymentQueue, TopicExchange exchange) {
        return BindingBuilder.bind(orderPaymentQueue).to(exchange).with(ROUTING_KEY_PAYMENT_SUCCESS);
    }

    @Bean
    public Binding paymentFailedBinding(Queue orderPaymentQueue, TopicExchange exchange) {
        return BindingBuilder.bind(orderPaymentQueue).to(exchange).with(ROUTING_KEY_PAYMENT_FAILED);
    }

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

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
