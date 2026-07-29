package com.autocare.bookingservice.client;

import com.autocare.bookingservice.exception.NoAvailableMechanicException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

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
}
