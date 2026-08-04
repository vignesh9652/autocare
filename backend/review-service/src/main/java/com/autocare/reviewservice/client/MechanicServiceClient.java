package com.autocare.reviewservice.client;

import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Component
public class MechanicServiceClient {

    private final WebClient.Builder webClientBuilder;

    public MechanicServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Update a mechanic's average rating and totalJobsCompleted.
     *
     * Calls PUT /api/mechanics/{id}/rating on the mechanic-service via
     * Eureka, forwarding the caller's JWT (the endpoint requires a valid
     * token).
     *
     * @param mechanicId the mechanic to update
     * @param newRating  the newly submitted rating (1-5)
     * @param authHeader the caller's raw "Authorization" header
     */
    public void updateMechanicRating(Long mechanicId, int newRating, String authHeader) {
        Map<String, Double> body = Map.of("newRating", (double) newRating);

        webClientBuilder.build()
                .put()
                .uri("lb://MECHANIC-SERVICE/api/mechanics/{id}/rating", mechanicId)
                .header("Authorization", authHeader)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Void.class)
                .block();
    }
}
