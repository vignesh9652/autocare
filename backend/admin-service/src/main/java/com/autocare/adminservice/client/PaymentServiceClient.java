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
 * Client for payment-service.
 *
 * <p><b>TODO / STUB:</b> payment-service's existing <code>GET /api/payments</code>
 * only returns the authenticated user's OWN transactions. This client calls the
 * hypothetical admin-only <code>GET /api/payments/admin/all</code>. Until that
 * endpoint is added to payment-service, this call always fails and the
 * circuit-breaker fallback reports payment-service as unavailable.</p>
 */
@Component
public class PaymentServiceClient {

    private static final Logger log = LoggerFactory.getLogger(PaymentServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public PaymentServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Fetches all payment transactions.
     *
     * @param authHeader the admin caller's "Authorization" header, forwarded so
     *                   payment-service can authenticate the internal call
     */
    @CircuitBreaker(name = "paymentService", fallbackMethod = "getAllTransactionsFallback")
    public ServiceResult<List<Map<String, Object>>> getAllTransactions(String authHeader) {
        List<Map<String, Object>> transactions = webClientBuilder.build()
                .get()
                .uri("lb://PAYMENT-SERVICE/api/payments/admin/all")
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .defaultIfEmpty(Collections.emptyList())
                .block();
        return ServiceResult.of(transactions);
    }

    private ServiceResult<List<Map<String, Object>>> getAllTransactionsFallback(String authHeader, Throwable t) {
        log.warn("⚠️ payment-service unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }
}
