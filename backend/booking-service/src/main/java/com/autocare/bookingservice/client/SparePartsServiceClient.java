package com.autocare.bookingservice.client;

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
 * <p>Used by the spare-part installation flow:</p>
 * <ul>
 *   <li>{@link #getOrder} validates that a purchased order belongs to the
 *       customer and is paid — called with the customer's own JWT forwarded,
 *       so ownership is enforced by spareparts-service.</li>
 *   <li>{@link #isOrderDelivered} checks the delivery status so a mechanic
 *       cannot start an installation before the part has been delivered
 *       (service-to-service call).</li>
 * </ul>
 */
@Component
public class SparePartsServiceClient {

    private static final Logger log = LoggerFactory.getLogger(SparePartsServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public SparePartsServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Fetches an order for the authenticated customer (ownership enforced by
     * spareparts-service via the forwarded JWT).
     *
     * @return the order payload (id, userId, status, paymentStatus, …) or
     *         {@code null} when it doesn't exist / isn't owned by the caller
     */
    public Map<String, Object> getOrder(Long orderId, String authHeader) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("lb://SPAREPARTS-SERVICE/api/orders/{id}", orderId)
                    .header("Authorization", authHeader)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .block();
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 404 || e.getStatusCode().value() == 403) {
                return null;
            }
            throw new IllegalStateException(
                    "Could not validate the spare part order (spareparts-service "
                            + e.getStatusCode() + ")", e);
        }
    }

    /**
     * Checks whether an order has been delivered. Used to gate the mechanic's
     * "Start Installation" action until the customer received the part.
     */
    public boolean isOrderDelivered(Long orderId) {
        try {
            Map<String, Object> status = webClientBuilder.build()
                    .get()
                    .uri("lb://SPAREPARTS-SERVICE/api/orders/internal/{id}/status", orderId)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .block();
            return status != null && Boolean.TRUE.equals(status.get("delivered"));
        } catch (WebClientResponseException.NotFound e) {
            return false;
        } catch (RuntimeException e) {
            log.warn("⚠️ spareparts-service delivery check failed for order #{}: {}",
                    orderId, String.valueOf(e));
            return false;
        }
    }
}
