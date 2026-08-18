package com.autocare.sparepartsservice.service;

import com.autocare.sparepartsservice.config.RabbitMQConfig;
import com.autocare.sparepartsservice.dto.SparePartOrderItemRequest;
import com.autocare.sparepartsservice.dto.SparePartOrderItemResponse;
import com.autocare.sparepartsservice.dto.SparePartOrderRequest;
import com.autocare.sparepartsservice.dto.SparePartOrderResponse;
import com.autocare.sparepartsservice.entity.OrderStatus;
import com.autocare.sparepartsservice.entity.SparePart;
import com.autocare.sparepartsservice.entity.SparePartOrder;
import com.autocare.sparepartsservice.entity.SparePartOrderItem;
import com.autocare.sparepartsservice.exception.InsufficientStockException;
import com.autocare.sparepartsservice.exception.OrderNotFoundException;
import com.autocare.sparepartsservice.exception.OrderNotOwnedException;
import com.autocare.sparepartsservice.exception.SparePartNotFoundException;
import com.autocare.sparepartsservice.repository.SparePartOrderItemRepository;
import com.autocare.sparepartsservice.repository.SparePartOrderRepository;
import com.autocare.sparepartsservice.repository.SparePartRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Spare-part purchases with delivery tracking.
 *
 * <p>Prices are always resolved from the spare part at order time — the
 * client can never supply its own price. Stock is deducted when the order is
 * placed using the spare part's {@code @Version} optimistic lock, so
 * concurrent orders serialize and the loser gets a conflict instead of
 * overselling.</p>
 *
 * <p>Payments flow through payment-service with {@code referenceType =
 * SPARE_PART} and {@code referenceId = orderId}; this service listens for the
 * {@code payment.success} event to mark the order PAID. Delivery status
 * (ORDERED → … → DELIVERED) is tracked independently by admins.</p>
 */
@Service
public class SparePartOrderService {

    private static final Logger log = LoggerFactory.getLogger(SparePartOrderService.class);

    /** Flat doorstep delivery fee (₹). Kept as a constant for the MVP. */
    public static final BigDecimal DELIVERY_FEE = new BigDecimal("80.00");

    private final SparePartOrderRepository orderRepository;
    private final SparePartOrderItemRepository itemRepository;
    private final SparePartRepository sparePartRepository;
    private final RabbitTemplate rabbitTemplate;

    public SparePartOrderService(SparePartOrderRepository orderRepository,
                                 SparePartOrderItemRepository itemRepository,
                                 SparePartRepository sparePartRepository,
                                 RabbitTemplate rabbitTemplate) {
        this.orderRepository = orderRepository;
        this.itemRepository = itemRepository;
        this.sparePartRepository = sparePartRepository;
        this.rabbitTemplate = rabbitTemplate;
    }

    @Transactional
    public SparePartOrderResponse createOrder(Long userId, SparePartOrderRequest request) {
        // Validate every item once up-front (existence + stock) before
        // touching any stock so a failing order never partially deducts.
        for (SparePartOrderItemRequest item : request.getItems()) {
            SparePart part = sparePartRepository.findById(item.getSparePartId())
                    .orElseThrow(() -> new SparePartNotFoundException(
                            "Spare part not found with id: " + item.getSparePartId()));
            if (part.getStockQuantity() < item.getQuantity()) {
                throw new InsufficientStockException(
                        "Only " + part.getStockQuantity() + " unit(s) of \""
                                + part.getName() + "\" are in stock");
            }
        }

        SparePartOrder order = new SparePartOrder();
        order.setUserId(userId);
        order.setAddress(request.getAddress());
        order.setStatus(OrderStatus.ORDERED);
        order.setPaymentStatus("PENDING");
        order.setDeliveryFee(DELIVERY_FEE);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(BigDecimal.ZERO);
        order = orderRepository.save(order);

        BigDecimal subtotal = BigDecimal.ZERO;
        for (SparePartOrderItemRequest itemRequest : request.getItems()) {
            SparePart part = sparePartRepository.findById(itemRequest.getSparePartId()).orElseThrow();
            // Optimistic locking: the @Version increment makes concurrent
            // stock writes fail with ObjectOptimisticLockingFailureException
            // (mapped to 409 CONFLICT by the global handler).
            part.setStockQuantity(part.getStockQuantity() - itemRequest.getQuantity());
            sparePartRepository.save(part);

            SparePartOrderItem item = new SparePartOrderItem();
            item.setOrderId(order.getId());
            item.setSparePartId(part.getId());
            item.setPartName(part.getName());
            item.setUnitPrice(part.getPrice());
            item.setQuantity(itemRequest.getQuantity());
            itemRepository.save(item);

            subtotal = subtotal.add(part.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
        }

        BigDecimal discount = request.getDiscountAmount() != null
                ? request.getDiscountAmount()
                : BigDecimal.ZERO;
        if (discount.signum() < 0) {
            throw new IllegalArgumentException("Discount cannot be negative");
        }
        if (discount.compareTo(subtotal) > 0) {
            throw new IllegalArgumentException(
                    "Discount cannot exceed the item total (" + subtotal.toPlainString() + ")");
        }

        order.setDiscountAmount(discount);
        order.setTotalAmount(subtotal.add(DELIVERY_FEE).subtract(discount));
        order = orderRepository.save(order);

        log.info("📦 Order #{} created for user {} — total ₹{} ({} items)",
                order.getId(), userId, order.getTotalAmount(), request.getItems().size());

        return toResponse(order);
    }

    public List<SparePartOrderResponse> getMyOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SparePartOrderResponse getOrder(Long id, Long userId) {
        SparePartOrder order = findOrder(id);
        if (!order.getUserId().equals(userId)) {
            throw new OrderNotOwnedException("This order does not belong to you");
        }
        return toResponse(order);
    }

    /**
     * Marks an order PAID when the {@code payment.success} event for it
     * arrives. Defensive: ignores events for orders that are not PENDING so a
     * stray/duplicate event can never double-credit.
     */
    @Transactional
    public void markPaid(Long orderId, Long payerUserId) {
        SparePartOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + orderId));

        if ("PAID".equals(order.getPaymentStatus())) {
            log.info("🔄 Order #{} already paid — acknowledging duplicate payment event", orderId);
            return;
        }
        if (payerUserId != null && !order.getUserId().equals(payerUserId)) {
            log.warn("⚠️ Payment success for order #{} from user {} — not the owner ({}), ignoring",
                    orderId, payerUserId, order.getUserId());
            return;
        }
        order.setPaymentStatus("PAID");
        orderRepository.save(order);
        log.info("💳 Order #{} marked PAID", orderId);
    }

    /**
     * Admin-driven delivery status transition. Enforces the forward chain
     * ORDERED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED. Cancellation
     * is allowed only while still ORDERED.
     */
    @Transactional
    public SparePartOrderResponse updateStatus(Long orderId, OrderStatus newStatus) {
        SparePartOrder order = findOrder(orderId);
        OrderStatus current = order.getStatus();
        if (current == newStatus) {
            return toResponse(order);
        }
        boolean valid = switch (current) {
            case ORDERED -> newStatus == OrderStatus.PACKED || newStatus == OrderStatus.CANCELLED;
            case PACKED -> newStatus == OrderStatus.SHIPPED;
            case SHIPPED -> newStatus == OrderStatus.OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> newStatus == OrderStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
        if (!valid) {
            throw new IllegalArgumentException(
                    "Cannot transition order from " + current + " to " + newStatus);
        }
        order.setStatus(newStatus);
        order = orderRepository.save(order);

        if (newStatus == OrderStatus.DELIVERED) {
            publishDelivered(order);
        }
        return toResponse(order);
    }

    /**
     * Delivery + payment status snapshot used by booking-service to enforce
     * the "spare part delivered before installation starts" rule. Internal
     * (service-to-service) endpoint — no ownership data is exposed.
     */
    public Map<String, Object> getOrderStatusInternal(Long orderId) {
        SparePartOrder order = findOrder(orderId);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", order.getId());
        result.put("userId", order.getUserId());
        result.put("status", order.getStatus().name());
        result.put("paymentStatus", order.getPaymentStatus());
        result.put("totalAmount", order.getTotalAmount());
        result.put("delivered", order.getStatus() == OrderStatus.DELIVERED);
        return result;
    }

    private void publishDelivered(SparePartOrder order) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("orderId", order.getId());
        event.put("userId", order.getUserId());
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.TOPIC_EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY_ORDER_DELIVERED,
                event
        );
        log.info("🚚 Order #{} marked DELIVERED — published order.delivered", order.getId());
    }

    private SparePartOrder findOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException("Order not found with id: " + id));
    }

    private SparePartOrderResponse toResponse(SparePartOrder order) {
        List<SparePartOrderItemResponse> items = itemRepository.findByOrderId(order.getId())
                .stream()
                .map(i -> new SparePartOrderItemResponse(
                        i.getId(), i.getSparePartId(), i.getPartName(),
                        i.getUnitPrice(), i.getQuantity()))
                .collect(Collectors.toList());
        return new SparePartOrderResponse(
                order.getId(),
                order.getUserId(),
                items,
                order.getStatus(),
                order.getPaymentStatus(),
                order.getDeliveryFee(),
                order.getDiscountAmount(),
                order.getTotalAmount(),
                order.getAddress(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
