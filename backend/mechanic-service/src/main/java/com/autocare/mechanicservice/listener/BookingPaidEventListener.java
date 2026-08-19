package com.autocare.mechanicservice.listener;

import com.autocare.mechanicservice.config.RabbitMQConfig;
import com.autocare.mechanicservice.service.MechanicEarningService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitHandler;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Records a mechanic's earning the moment a booking is paid
 * ({@code booking.paid} published by booking-service).
 */
@Component
@RabbitListener(queues = RabbitMQConfig.QUEUE_MECHANIC_EARNINGS,
        containerFactory = "earningListenerContainerFactory")
public class BookingPaidEventListener {

    private static final Logger log = LoggerFactory.getLogger(BookingPaidEventListener.class);

    private final MechanicEarningService earningService;

    public BookingPaidEventListener(MechanicEarningService earningService) {
        this.earningService = earningService;
    }

    @RabbitHandler
    public void onBookingPaid(Map<String, Object> event) {
        log.info("💳 booking.paid event received: {}", event);
        earningService.recordEarning(event);
    }
}
