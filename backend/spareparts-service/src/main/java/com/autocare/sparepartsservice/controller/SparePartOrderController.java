package com.autocare.sparepartsservice.controller;

import com.autocare.sparepartsservice.dto.SparePartOrderRequest;
import com.autocare.sparepartsservice.dto.SparePartOrderResponse;
import com.autocare.sparepartsservice.entity.OrderStatus;
import com.autocare.sparepartsservice.service.SparePartOrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Spare-part orders: customers place and track their own orders; admins drive
 * the delivery status chain. Ownership is always derived from the JWT — the
 * client can never choose whose order to read.
 */
@RestController
@RequestMapping("/api/orders")
public class SparePartOrderController {

    private final SparePartOrderService orderService;

    public SparePartOrderController(SparePartOrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<SparePartOrderResponse> createOrder(
            @Valid @RequestBody SparePartOrderRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<SparePartOrderResponse>> getMyOrders(
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getMyOrders(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SparePartOrderResponse> getOrder(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(orderService.getOrder(id, userId));
    }

    /** Admin-only: advance the delivery status chain. */
    @PutMapping("/admin/{id}/status")
    public ResponseEntity<SparePartOrderResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("status is required");
        }
        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid order status: " + status + " (expected ORDERED, PACKED, SHIPPED, "
                            + "OUT_FOR_DELIVERY, DELIVERED or CANCELLED)");
        }
        return ResponseEntity.ok(orderService.updateStatus(id, newStatus));
    }

    /**
     * Delivery/payment snapshot for booking-service (service-to-service).
     * Only order id, status and payment status are returned.
     */
    @GetMapping("/internal/{id}/status")
    public ResponseEntity<Map<String, Object>> getOrderStatusInternal(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderStatusInternal(id));
    }
}
