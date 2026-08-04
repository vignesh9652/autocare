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
 * Client for user-service.
 *
 * <p><b>TODO / STUB:</b> user-service currently exposes ONLY /api/auth/register
 * and /api/auth/login — there is no "list all users" endpoint. This client
 * calls the hypothetical admin-only <code>GET /api/users/admin/all</code>.
 * Until that endpoint is added to user-service, this call always fails and the
 * circuit-breaker fallback reports user-service as unavailable.</p>
 */
@Component
public class UserServiceClient {

    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public UserServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Fetches all users.
     *
     * @param authHeader the admin caller's "Authorization" header, forwarded so
     *                   user-service can authenticate the internal call
     */
    @CircuitBreaker(name = "userService", fallbackMethod = "getUsersFallback")
    public ServiceResult<List<Map<String, Object>>> getUsers(String authHeader) {
        List<Map<String, Object>> users = webClientBuilder.build()
                .get()
                .uri("lb://USER-SERVICE/api/users/admin/all")
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .defaultIfEmpty(Collections.emptyList())
                .block();
        return ServiceResult.of(users);
    }

    private ServiceResult<List<Map<String, Object>>> getUsersFallback(String authHeader, Throwable t) {
        log.warn("⚠️ user-service unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }
}
