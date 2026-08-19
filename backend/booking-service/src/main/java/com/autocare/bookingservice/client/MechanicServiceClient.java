package com.autocare.bookingservice.client;

import com.autocare.bookingservice.exception.NoAvailableMechanicException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Component
public class MechanicServiceClient {

    private final WebClient.Builder webClientBuilder;

    public MechanicServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Find an available mechanic matching the preferred skill and service area.
     * Calls GET /api/mechanics?available=true&skill={skill}&area={area}
     * on the mechanic-service via Eureka. Returns the first available mechanic's ID.
     *
     * @param preferredSkill the required skill (optional)
     * @param serviceArea    the service area (optional)
     * @return the mechanic ID of the first available mechanic
     * @throws NoAvailableMechanicException if no mechanic is found
     */
    public Long findAvailableMechanic(String preferredSkill, String serviceArea) {
        StringBuilder uri = new StringBuilder("lb://MECHANIC-SERVICE/api/mechanics?available=true");

        if (preferredSkill != null && !preferredSkill.isBlank()) {
            uri.append("&skill=").append(preferredSkill);
        }
        if (serviceArea != null && !serviceArea.isBlank()) {
            uri.append("&area=").append(serviceArea);
        }

        Map[] mechanicsArray = webClientBuilder.build()
                .get()
                .uri(uri.toString())
                .retrieve()
                .bodyToMono(Map[].class)
                .block();

        if (mechanicsArray == null || mechanicsArray.length == 0) {
            throw new NoAvailableMechanicException(
                    "No available mechanic found matching the criteria");
        }

        List<Map> mechanics = Arrays.asList(mechanicsArray);

        Map firstMechanic = mechanics.get(0);
        return ((Number) firstMechanic.get("id")).longValue();
    }

    /**
     * Fetches a single mechanic profile by its id. Used to validate that a
     * customer-chosen mechanic exists and is currently available before the
     * booking is routed to them.
     *
     * @param id the mechanic profile id
     * @return the mechanic payload (id, availabilityStatus, userId, …)
     */
    public Map getMechanicById(Long id) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("lb://MECHANIC-SERVICE/api/mechanics/{id}", id)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (WebClientResponseException.NotFound e) {
            throw new NoAvailableMechanicException("Selected mechanic not found with id: " + id);
        }
    }

    /**
     * Resolves the mechanic profile id for a user account (the mechanic's JWT
     * subject). Returns {@code null} only when the account has no linked
     * profile (404). Any other failure (e.g. mechanic-service unreachable) is
     * propagated so callers surface a real error instead of silently showing
     * an empty job list.
     *
     * @param userId the mechanic's user account id
     * @return the mechanic profile id, or null if none exists
     */
    public Long getMechanicIdByUserId(Long userId) {
        try {
            Map response = webClientBuilder.build()
                    .get()
                    .uri("lb://MECHANIC-SERVICE/api/mechanics/by-user/{userId}", userId)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            if (response == null || response.get("id") == null) {
                return null;
            }
            return ((Number) response.get("id")).longValue();
        } catch (WebClientResponseException.NotFound e) {
            // No mechanic profile linked to this account yet.
            return null;
        }
    }
}
