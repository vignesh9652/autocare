package com.autocare.paymentservice.client;

import com.autocare.paymentservice.exception.PaymentGatewayException;
import com.autocare.paymentservice.exception.TransactionNotOwnedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.Map;

/**
 * Client for spareparts-service.
 *
 * <p>Calls the internal status endpoint to validate that a spare-part order
 * exists, belongs to the caller and is still PENDING payment.</p>
 */
@Component
public class SparePartsServiceClient {

    private static final Logger log = LoggerFactory.getLogger(SparePartsServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public SparePartsServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Fetches the order's status snapshot (id, status, paymentStatus) via the
     * internal endpoint. Ownership is validated by the spareparts-service using
     * the forwarded customer JWT.
     *
     * @param orderId    the spare-part order to load
     * @param authHeader the customer's raw "Authorization" header (Bearer JWT)
     * @return the order status payload (id, status, paymentStatus, delivered)
     */
    public Map<String, Object> getOrderStatus(Long orderId, String authHeader) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("lb://SPAREPARTS-SERVICE/api/orders/internal/{id}/status", orderId)
                    .header("Authorization", authHeader)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (WebClientResponseException.NotFound e) {
            throw new PaymentGatewayException("Spare-part order not found with id: " + orderId);
        } catch (WebClientResponseException.Forbidden e) {
            throw new TransactionNotOwnedException(
                    "This order does not belong to you (access denied by spareparts-service)");
        } catch (WebClientResponseException e) {
            throw new PaymentGatewayException(
                    "Spare-parts service rejected the request: " + e.getStatusCode());
        } catch (RuntimeException e) {
            log.warn("⚠️ spareparts-service call failed for order #{}: {}", orderId, e.getMessage());
            throw new PaymentGatewayException(
                    "Could not reach spareparts-service to validate order #" + orderId, e);
        }
    }
}
