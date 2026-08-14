package com.autocare.bookingservice.service;

import com.autocare.bookingservice.dto.BookingResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Keeps a registry of SSE clients subscribed to a booking and pushes
 * status-change events to them. Used for live order/booking tracking.
 */
@Component
public class BookingEventPublisher {

    private final Map<Long, List<SseEmitter>> subscribers = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long bookingId) {
        SseEmitter emitter = new SseEmitter(0L); // no timeout
        subscribers.computeIfAbsent(bookingId, k -> new CopyOnWriteArrayList<>())
                .add(emitter);

        emitter.onCompletion(() -> remove(bookingId, emitter));
        emitter.onTimeout(() -> remove(bookingId, emitter));
        emitter.onError(e -> remove(bookingId, emitter));

        // Send initial heartbeat so the client knows the stream is open
        try {
            emitter.send(SseEmitter.event().name("connected").data("stream ready"));
        } catch (IOException e) {
            remove(bookingId, emitter);
        }
        return emitter;
    }

    public void publishStatusChange(BookingResponse booking) {
        List<SseEmitter> emitters = subscribers.get(booking.getId());
        if (emitters == null || emitters.isEmpty()) return;

        emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("booking.status")
                        .data(Map.of(
                                "id", booking.getId(),
                                "status", booking.getStatus().name(),
                                "serviceType", booking.getServiceType(),
                                "scheduledAt", String.valueOf(booking.getScheduledAt()),
                                "estimatedAmount", booking.getEstimatedAmount() == null ? null : booking.getEstimatedAmount().toString()
                        )));
            } catch (IOException e) {
                remove(booking.getId(), emitter);
            }
        });
    }

    private void remove(Long bookingId, SseEmitter emitter) {
        List<SseEmitter> emitters = subscribers.get(bookingId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                subscribers.remove(bookingId);
            }
        }
    }
}
