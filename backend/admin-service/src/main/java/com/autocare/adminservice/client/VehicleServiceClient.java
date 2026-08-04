package com.autocare.adminservice.client;

import com.autocare.adminservice.dto.ServiceResult;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

/**
 * Client for vehicle-service.
 *
 * <p>Wraps the existing detail endpoint <code>GET /api/vehicles/{id}</code>
 * (which accepts inter-service calls without a JWT). Note there is currently
 * NO "list all vehicles" endpoint on vehicle-service — {@code GET /api/vehicles}
 * only returns the authenticated caller's own vehicles — so an admin "all
 * vehicles" endpoint (<code>GET /api/vehicles/admin/all</code>) would need to
 * be added before a full vehicle listing is possible.</p>
 */
@Component
public class VehicleServiceClient {

    private static final Logger log = LoggerFactory.getLogger(VehicleServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public VehicleServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    @CircuitBreaker(name = "vehicleService", fallbackMethod = "getVehicleFallback")
    public ServiceResult<Map<String, Object>> getVehicleById(Long vehicleId) {
        Map<String, Object> vehicle = webClientBuilder.build()
                .get()
                .uri("lb://VEHICLE-SERVICE/api/vehicles/{id}", vehicleId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        return ServiceResult.of(vehicle);
    }

    private ServiceResult<Map<String, Object>> getVehicleFallback(Long vehicleId, Throwable t) {
        log.warn("⚠️ vehicle-service unavailable (fallback): {}", t.getMessage());
        return ServiceResult.unavailable();
    }
}
