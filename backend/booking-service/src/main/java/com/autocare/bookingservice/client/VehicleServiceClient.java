package com.autocare.bookingservice.client;

import com.autocare.bookingservice.exception.BookingNotOwnedException;
import com.autocare.bookingservice.exception.BookingNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
public class VehicleServiceClient {

    private final WebClient.Builder webClientBuilder;

    public VehicleServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Verify that a vehicle exists and belongs to the given userId.
     * Calls GET /api/vehicles/{id} on the vehicle-service via Eureka.
     *
     * @param vehicleId the vehicle ID to verify
     * @param userId    the user who claims ownership
     */
    public void validateVehicleOwnership(Long vehicleId, Long userId) {
        Map vehicleResponse = webClientBuilder.build()
                .get()
                .uri("lb://VEHICLE-SERVICE/api/vehicles/{id}", vehicleId)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (vehicleResponse == null) {
            throw new BookingNotFoundException("Vehicle not found with id: " + vehicleId);
        }

        Object ownerId = vehicleResponse.get("userId");
        if (ownerId == null || ((Number) ownerId).longValue() != userId) {
            throw new BookingNotOwnedException("This vehicle does not belong to you");
        }
    }
}
