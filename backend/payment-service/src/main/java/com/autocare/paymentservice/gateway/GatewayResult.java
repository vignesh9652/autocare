package com.autocare.paymentservice.gateway;

/**
 * Result of initiating a payment at the gateway.
 *
 * @param gatewayTransactionId gateway-side identifier for the payment
 * @param status               gateway-side status (e.g. "PENDING")
 */
public record GatewayResult(String gatewayTransactionId, String status) {
}
