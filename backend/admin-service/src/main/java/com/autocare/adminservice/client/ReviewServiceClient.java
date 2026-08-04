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
 * Client for review-service.
 *
 * <p>Wraps the existing <code>GET /api/reviews/mechanic/{mechanicId}</code>
 * endpoint, which requires a valid JWT — the admin caller's token is forwarded.
 * No changes needed on review-service.</p>
 */
@Component
public class ReviewServiceClient {

    private static final Logger log = LoggerFactory.getLogger(ReviewServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public ReviewServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Fetches all reviews for a mechanic.
     *
     * @param mechanicId the mechanic whose reviews to fetch
     * @param authHeader the admin caller's "Authorization" header (review-service
     *                   requires a valid JWT on this endpoint)
     */
    @CircuitBreaker(name = "reviewService", fallbackMethod = "getReviewsFallback")
    public ServiceResult<List<Map<String, Object>>> getReviewsByMechanic(Long mechanicId, String authHeader) {
        List<Map<String, Object>> reviews = webClientBuilder.build()
                .get()
                .uri("lb://REVIEW-SERVICE/api/reviews/mechanic/{mechanicId}", mechanicId)
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .defaultIfEmpty(Collections.emptyList())
                .block();
        return ServiceResult.of(reviews);
    }

    private ServiceResult<List<Map<String, Object>>> getReviewsFallback(Long mechanicId, String authHeader, Throwable t) {
        log.warn("⚠️ review-service unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }
}
