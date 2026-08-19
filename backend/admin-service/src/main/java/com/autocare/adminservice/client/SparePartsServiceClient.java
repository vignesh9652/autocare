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
 * Client for spareparts-service.
 *
 * <p>Wraps the existing <code>GET /api/parts</code> endpoint, which is public
 * and returns the full catalog (including {@code stockQuantity}) — no changes
 * needed on spareparts-service.</p>
 */
@Component
public class SparePartsServiceClient {

    private static final Logger log = LoggerFactory.getLogger(SparePartsServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public SparePartsServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    @CircuitBreaker(name = "sparePartsService", fallbackMethod = "getAllPartsFallback")
    public ServiceResult<List<Map<String, Object>>> getAllParts() {
        List<Map<String, Object>> parts = webClientBuilder.build()
                .get()
                .uri("lb://SPAREPARTS-SERVICE/api/parts")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .defaultIfEmpty(Collections.emptyList())
                .block();
        return ServiceResult.of(parts);
    }

    private ServiceResult<List<Map<String, Object>>> getAllPartsFallback(Throwable t) {
        log.warn("⚠️ spareparts-service unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }
}
