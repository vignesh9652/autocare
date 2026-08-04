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
 * Client for mechanic-service.
 *
 * <p>Wraps the existing <code>GET /api/mechanics</code> endpoint, which is
 * public and returns ALL mechanics (with averageRating and
 * totalJobsCompleted) — no changes needed on mechanic-service.</p>
 */
@Component
public class MechanicServiceClient {

    private static final Logger log = LoggerFactory.getLogger(MechanicServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public MechanicServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    @CircuitBreaker(name = "mechanicService", fallbackMethod = "getAllMechanicsFallback")
    public ServiceResult<List<Map<String, Object>>> getAllMechanics() {
        List<Map<String, Object>> mechanics = webClientBuilder.build()
                .get()
                .uri("lb://MECHANIC-SERVICE/api/mechanics")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .defaultIfEmpty(Collections.emptyList())
                .block();
        return ServiceResult.of(mechanics);
    }

    private ServiceResult<List<Map<String, Object>>> getAllMechanicsFallback(Throwable t) {
        log.warn("⚠️ mechanic-service unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }
}
