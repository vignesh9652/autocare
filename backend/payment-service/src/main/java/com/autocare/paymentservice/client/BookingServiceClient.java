package com.autocare.paymentservice.client;

import com.autocare.paymentservice.exception.BookingNotFoundException;
import com.autocare.paymentservice.exception.PaymentGatewayException;
import com.autocare.paymentservice.exception.TransactionNotOwnedException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Client for booking-service.
 *
 * <p>Calls {@code GET /api/bookings/{id}} with the <b>customer's own JWT</b>
 * forwarded as the Authorization header. booking-service then enforces
 * ownership itself — a customer can never read (and therefore never pay for)
 * someone else's booking. The payment-service additionally double-checks the
 * returned owner id against the authenticated user (defense in depth).</p>
 */
@Component
public class BookingServiceClient {

    private static final Logger log = LoggerFactory.getLogger(BookingServiceClient.class);

    private final WebClient.Builder webClientBuilder;

    public BookingServiceClient(WebClient.Builder loadBalancedWebClientBuilder) {
        this.webClientBuilder = loadBalancedWebClientBuilder;
    }

    /**
     * Fetches a single booking for the authenticated customer.
     *
     * @param bookingId  the booking to load
     * @param authHeader the customer's raw "Authorization" header (Bearer JWT)
     * @return the booking payload (id, userId, status, finalAmount, …)
     */
    public Map<String, Object> getBooking(Long bookingId, String authHeader) {
        try {
            return webClientBuilder.build()
                    .get()
                    .uri("lb://BOOKING-SERVICE/api/bookings/{id}", bookingId)
                    .header("Authorization", authHeader)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .block();
        } catch (WebClientResponseException.NotFound e) {
            throw new BookingNotFoundException("Booking not found with id: " + bookingId);
        } catch (WebClientResponseException.Forbidden e) {
            throw new TransactionNotOwnedException(
                    "This booking does not belong to you (access denied by booking-service)");
        } catch (WebClientResponseException e) {
            throw new PaymentGatewayException(
                    "Booking service rejected the request: " + e.getStatusCode());
        } catch (RuntimeException e) {
            log.warn("⚠️ booking-service call failed for booking #{}: {}", bookingId, String.valueOf(e));
            throw new PaymentGatewayException(
                    "Could not reach booking-service to validate booking #" + bookingId, e);
        }
    }

    /**
     * Fetches the platform-configured installation fee from booking-service.
     * Used by the Buy+Install combined payment flow to add the installation
     * fee to the Razorpay order amount.
     */
    public BigDecimal currentInstallationFee() {
        try {
            Map<String, Object> result = webClientBuilder.build()
                    .get()
                    .uri("lb://BOOKING-SERVICE/api/services/admin/installation-fee")
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {
                    })
                    .block();
            if (result != null && result.get("installationFee") != null) {
                Object fee = result.get("installationFee");
                if (fee instanceof Number n) return new BigDecimal(n.toString());
                if (fee instanceof String s) return new BigDecimal(s);
            }
            return new BigDecimal("300.00");
        } catch (Exception e) {
            log.warn("⚠️ Could not fetch installation fee from booking-service, using default ₹300: {}",
                    e.getMessage());
            return new BigDecimal("300.00");
        }
    }
}
