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
 * Client for the wallet module, which lives in booking-service
 * ({@code /api/wallet/admin/**}). The admin caller's JWT is forwarded so
 * booking-service can authenticate the internal call.
 */
@Component
public class WalletServiceClient {

    private static final Logger log = LoggerFactory.getLogger(WalletServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public WalletServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    @CircuitBreaker(name = "walletService", fallbackMethod = "walletFallback")
    public ServiceResult<Map<String, Object>> getAdminWallet(String authHeader) {
        Map<String, Object> wallet = webClientBuilder.build()
                .get()
                .uri("lb://BOOKING-SERVICE/api/wallet/admin")
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        return ServiceResult.of(wallet);
    }

    @CircuitBreaker(name = "walletService", fallbackMethod = "walletTransactionsFallback")
    public ServiceResult<List<Map<String, Object>>> getAdminTransactions(String authHeader) {
        List<Map<String, Object>> transactions = webClientBuilder.build()
                .get()
                .uri("lb://BOOKING-SERVICE/api/wallet/admin/transactions")
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .defaultIfEmpty(Collections.emptyList())
                .block();
        return ServiceResult.of(transactions);
    }

    @CircuitBreaker(name = "walletService", fallbackMethod = "walletWithdrawalsFallback")
    public ServiceResult<List<Map<String, Object>>> getWithdrawals(String authHeader, String status) {
        String uri = status != null && !status.isBlank()
                ? "lb://BOOKING-SERVICE/api/wallet/admin/withdrawals?status=" + status
                : "lb://BOOKING-SERVICE/api/wallet/admin/withdrawals";
        List<Map<String, Object>> requests = webClientBuilder.build()
                .get()
                .uri(uri)
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<List<Map<String, Object>>>() {})
                .defaultIfEmpty(Collections.emptyList())
                .block();
        return ServiceResult.of(requests);
    }

    @CircuitBreaker(name = "walletService", fallbackMethod = "withdrawalActionFallback")
    public ServiceResult<Map<String, Object>> approveWithdrawal(Long id, String authHeader) {
        return withdrawalAction("approve", id, authHeader);
    }

    @CircuitBreaker(name = "walletService", fallbackMethod = "withdrawalActionFallback")
    public ServiceResult<Map<String, Object>> rejectWithdrawal(Long id, String authHeader) {
        return withdrawalAction("reject", id, authHeader);
    }

    @CircuitBreaker(name = "walletService", fallbackMethod = "refundFallback")
    public ServiceResult<Map<String, Object>> refundBooking(Long bookingId, String authHeader) {
        Map<String, Object> result = webClientBuilder.build()
                .post()
                .uri("lb://BOOKING-SERVICE/api/wallet/admin/bookings/{bookingId}/refund", bookingId)
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        return ServiceResult.of(result);
    }

    private ServiceResult<Map<String, Object>> withdrawalAction(String action, Long id, String authHeader) {
        Map<String, Object> result = webClientBuilder.build()
                .post()
                .uri("lb://BOOKING-SERVICE/api/wallet/admin/withdrawals/{id}/" + action, id)
                .header("Authorization", authHeader)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        return ServiceResult.of(result);
    }

    // ─── Fallbacks ─────────────────────────────────────────────────────────

    private ServiceResult<Map<String, Object>> walletFallback(String authHeader, Throwable t) {
        log.warn("⚠️ wallet (booking-service) unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }

    private ServiceResult<List<Map<String, Object>>> walletTransactionsFallback(String authHeader, Throwable t) {
        log.warn("⚠️ wallet transactions (booking-service) unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }

    private ServiceResult<List<Map<String, Object>>> walletWithdrawalsFallback(String authHeader, String status, Throwable t) {
        log.warn("⚠️ wallet withdrawals (booking-service) unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }

    private ServiceResult<Map<String, Object>> withdrawalActionFallback(Long id, String authHeader, Throwable t) {
        log.warn("⚠️ withdrawal action (booking-service) unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }

    private ServiceResult<Map<String, Object>> refundFallback(Long bookingId, String authHeader, Throwable t) {
        log.warn("⚠️ wallet refund (booking-service) unavailable (fallback): {}", String.valueOf(t));
        return ServiceResult.unavailable();
    }
}
