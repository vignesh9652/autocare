package com.autocare.reviewservice.client;

import com.autocare.reviewservice.exception.BookingNotOwnedException;
import com.autocare.reviewservice.exception.BookingNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
public class BookingServiceClient {

    private final WebClient.Builder webClientBuilder;

    public BookingServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Fetch a booking from the booking-service via Eureka.
     *
     * Calls GET /api/bookings/{id} on the booking-service, forwarding the
     * caller's JWT so the booking-service can authenticate the request and
     * enforce its own ownership check.
     *
     * @param bookingId  the booking to fetch
     * @param authHeader the caller's raw "Authorization" header
     * @return the booking payload (id, userId, mechanicId, status, ...)
     * @throws BookingNotFoundException if the booking does not exist
     * @throws BookingNotOwnedException if the booking belongs to a different user
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> getBooking(Long bookingId, String authHeader) {
        return webClientBuilder.build()
                .get()
                .uri("lb://BOOKING-SERVICE/api/bookings/{id}", bookingId)
                .header("Authorization", authHeader)
                .retrieve()
                .onStatus(status -> status.value() == HttpStatus.NOT_FOUND.value(),
                        response -> Mono.error(
                                new BookingNotFoundException("Booking not found with id: " + bookingId)))
                .onStatus(status -> status.value() == HttpStatus.FORBIDDEN.value(),
                        response -> Mono.error(
                                new BookingNotOwnedException("This booking does not belong to you")))
                .bodyToMono(Map.class)
                .block();
    }
}
