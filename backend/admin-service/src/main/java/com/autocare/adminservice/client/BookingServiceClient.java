package com.autocare.adminservice.client;

import com.autocare.adminservice.dto.ServiceResult;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Client for booking-service.
 *
 * <p><b>TODO / STUB:</b> booking-service's existing <code>GET /api/bookings</code>
 * only returns the authenticated user's OWN bookings. This client calls the
 * hypothetical admin-only <code>GET /api/bookings/admin/all</code>. Until that
 * endpoint is added to booking-service, this call always fails and the
 * circuit-breaker fallback reports booking-service as unavailable.</p>
 */
@Component
public class BookingServiceClient {

    private static final Logger log = LoggerFactory.getLogger(BookingServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public BookingServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Fetches all bookings across all users.
     *
     * @param authHeader the admin caller's "Authorization" header, forwarded so
     *                   booking-service can authenticate the internal call
     */
    @CircuitBreaker(name = "bookingService", fallbackMethod = "getAllBookingsFallback")
    public ServiceResult<List<Map<String, Object>>> getAllBookings(String authHeader) {
        List<Map<String, Object>> bookings = webClientBuilder.build()
                .get()
                .uri("lb://BOOKING-SERVICE/api/bookings/admin/all")
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .defaultIfEmpty(Collections.emptyList())
                .block();
        return ServiceResult.of(bookings);
    }

    private ServiceResult<List<Map<String, Object>>> getAllBookingsFallback(String authHeader, Throwable t) {
        log.warn("⚠️ booking-service unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }
}
