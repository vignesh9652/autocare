package com.autocare.sparepartsservice.service;

import com.autocare.sparepartsservice.dto.SparePartOrderItemRequest;
import com.autocare.sparepartsservice.dto.SparePartOrderRequest;
import com.autocare.sparepartsservice.dto.SparePartOrderResponse;
import com.autocare.sparepartsservice.entity.OrderStatus;
import com.autocare.sparepartsservice.entity.SparePart;
import com.autocare.sparepartsservice.entity.SparePartOrder;
import com.autocare.sparepartsservice.entity.SparePartOrderItem;
import com.autocare.sparepartsservice.exception.InsufficientStockException;
import com.autocare.sparepartsservice.exception.OrderNotFoundException;
import com.autocare.sparepartsservice.exception.OrderNotOwnedException;
import com.autocare.sparepartsservice.repository.SparePartOrderItemRepository;
import com.autocare.sparepartsservice.repository.SparePartOrderRepository;
import com.autocare.sparepartsservice.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SparePartOrderServiceTest {

    @Mock
    private SparePartOrderRepository orderRepository;

    @Mock
    private SparePartOrderItemRepository itemRepository;

    @Mock
    private SparePartRepository sparePartRepository;

    @Mock
    private RabbitTemplate rabbitTemplate;

    private SparePartOrderService orderService;

    private final Long userId = 1L;
    private final Long otherUserId = 2L;
    private final Long partId = 100L;
    private final Long orderId = 300L;

    private SparePart part;
    private SparePartOrder order;

    @BeforeEach
    void setUp() {
        orderService = new SparePartOrderService(
                orderRepository, itemRepository, sparePartRepository, rabbitTemplate);

        part = new SparePart("Brake Pad Set", "Ceramic brake pads",
                List.of("Toyota Camry"), new BigDecimal("1200.00"), 10, "BRAKES");
        part.setId(partId);

        order = new SparePartOrder();
        order.setId(orderId);
        order.setUserId(userId);
        order.setStatus(OrderStatus.ORDERED);
        order.setPaymentStatus("PENDING");
        order.setDeliveryFee(new BigDecimal("80.00"));
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setTotalAmount(new BigDecimal("1280.00"));
        order.setAddress("123 Main St");
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
    }

    // ─── CREATE ─────────────────────────────────────────────────────────

    @Test
    void createOrder_ShouldDeductStockAndComputeTotals() {
        SparePartOrderItemRequest itemRequest = new SparePartOrderItemRequest();
        itemRequest.setSparePartId(partId);
        itemRequest.setQuantity(2);

        SparePartOrderRequest request = new SparePartOrderRequest();
        request.setItems(List.of(itemRequest));
        request.setAddress("123 Main St");

        when(sparePartRepository.findById(partId)).thenReturn(Optional.of(part));
        when(orderRepository.save(any(SparePartOrder.class)))
                .thenAnswer(inv -> { SparePartOrder o = inv.getArgument(0); o.setId(orderId); return o; });
        when(itemRepository.save(any(SparePartOrderItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(itemRepository.findByOrderId(orderId)).thenReturn(List.of());

        SparePartOrderResponse response = orderService.createOrder(userId, request);

        // subtotal 2400 + delivery 80 = 2480
        assertEquals(0, new BigDecimal("2480.00").compareTo(response.getTotalAmount()));
        assertEquals(OrderStatus.ORDERED, response.getStatus());
        assertEquals("PENDING", response.getPaymentStatus());
        // stock deducted 10 -> 8
        assertEquals(8, part.getStockQuantity());
        verify(sparePartRepository, times(2)).findById(partId);
    }

    @Test
    void createOrder_WithDiscount_ShouldSubtractIt() {
        SparePartOrderItemRequest itemRequest = new SparePartOrderItemRequest();
        itemRequest.setSparePartId(partId);
        itemRequest.setQuantity(1);

        SparePartOrderRequest request = new SparePartOrderRequest();
        request.setItems(List.of(itemRequest));
        request.setAddress("123 Main St");
        request.setDiscountAmount(new BigDecimal("100.00"));

        when(sparePartRepository.findById(partId)).thenReturn(Optional.of(part));
        when(orderRepository.save(any(SparePartOrder.class)))
                .thenAnswer(inv -> { SparePartOrder o = inv.getArgument(0); o.setId(orderId); return o; });
        when(itemRepository.save(any(SparePartOrderItem.class))).thenAnswer(inv -> inv.getArgument(0));
        when(itemRepository.findByOrderId(orderId)).thenReturn(List.of());

        SparePartOrderResponse response = orderService.createOrder(userId, request);

        // 1200 + 80 - 100 = 1180
        assertEquals(0, new BigDecimal("1180.00").compareTo(response.getTotalAmount()));
        assertEquals(0, new BigDecimal("100.00").compareTo(response.getDiscountAmount()));
    }

    @Test
    void createOrder_WithDiscountLargerThanSubtotal_ShouldReject() {
        SparePartOrderItemRequest itemRequest = new SparePartOrderItemRequest();
        itemRequest.setSparePartId(partId);
        itemRequest.setQuantity(1);

        SparePartOrderRequest request = new SparePartOrderRequest();
        request.setItems(List.of(itemRequest));
        request.setAddress("123 Main St");
        request.setDiscountAmount(new BigDecimal("99999.00"));

        when(sparePartRepository.findById(partId)).thenReturn(Optional.of(part));
        when(orderRepository.save(any(SparePartOrder.class)))
                .thenAnswer(inv -> { SparePartOrder o = inv.getArgument(0); o.setId(orderId); return o; });
        when(itemRepository.save(any(SparePartOrderItem.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThrows(IllegalArgumentException.class,
                () -> orderService.createOrder(userId, request));
    }

    @Test
    void createOrder_WithInsufficientStock_ShouldRejectWithoutDeducting() {
        SparePartOrderItemRequest itemRequest = new SparePartOrderItemRequest();
        itemRequest.setSparePartId(partId);
        itemRequest.setQuantity(50);

        SparePartOrderRequest request = new SparePartOrderRequest();
        request.setItems(List.of(itemRequest));
        request.setAddress("123 Main St");

        when(sparePartRepository.findById(partId)).thenReturn(Optional.of(part));

        assertThrows(InsufficientStockException.class,
                () -> orderService.createOrder(userId, request));

        assertEquals(10, part.getStockQuantity());
        verify(orderRepository, never()).save(any());
    }

    // ─── ACCESS / OWNERSHIP ─────────────────────────────────────────────

    @Test
    void getOrder_ByOwner_ShouldReturnOrder() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(itemRepository.findByOrderId(orderId)).thenReturn(List.of());

        SparePartOrderResponse response = orderService.getOrder(orderId, userId);

        assertEquals(orderId, response.getId());
        assertEquals(userId, response.getUserId());
    }

    @Test
    void getOrder_ByAnotherUser_ShouldThrow() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThrows(OrderNotOwnedException.class,
                () -> orderService.getOrder(orderId, otherUserId));
    }

    @Test
    void getOrder_WithUnknownId_ShouldThrow() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(OrderNotFoundException.class, () -> orderService.getOrder(999L, userId));
    }

    @Test
    void getMyOrders_ShouldReturnOnlyOwnOrders() {
        when(orderRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(order));
        when(itemRepository.findByOrderId(orderId)).thenReturn(List.of());

        List<SparePartOrderResponse> responses = orderService.getMyOrders(userId);

        assertEquals(1, responses.size());
        verify(orderRepository).findByUserIdOrderByCreatedAtDesc(userId);
    }

    // ─── PAYMENT ────────────────────────────────────────────────────────

    @Test
    void markPaid_ShouldUpdatePaymentStatus() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(SparePartOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        orderService.markPaid(orderId, userId);

        assertEquals("PAID", order.getPaymentStatus());
        verify(orderRepository).save(any(SparePartOrder.class));
    }

    @Test
    void markPaid_ByAnotherUser_ShouldIgnore() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        orderService.markPaid(orderId, otherUserId);

        assertEquals("PENDING", order.getPaymentStatus());
        verify(orderRepository, never()).save(any());
    }

    @Test
    void markPaid_WhenAlreadyPaid_ShouldBeIdempotent() {
        order.setPaymentStatus("PAID");
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        orderService.markPaid(orderId, userId);

        verify(orderRepository, never()).save(any());
    }

    // ─── DELIVERY STATUS ────────────────────────────────────────────────

    @Test
    void updateStatus_ShouldAdvanceTheDeliveryChain() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(SparePartOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        SparePartOrderResponse response = orderService.updateStatus(orderId, OrderStatus.PACKED);

        assertEquals(OrderStatus.PACKED, response.getStatus());
    }

    @Test
    void updateStatus_ToDelivered_ShouldPublishEvent() {
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(SparePartOrder.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(rabbitTemplate).convertAndSend(
                eq("autocare.events"), eq("spare-part-order.delivered"), any(Object.class));

        orderService.updateStatus(orderId, OrderStatus.DELIVERED);

        verify(rabbitTemplate).convertAndSend(
                eq("autocare.events"), eq("spare-part-order.delivered"), any(Object.class));
    }

    @Test
    void updateStatus_WithInvalidTransition_ShouldReject() {
        order.setStatus(OrderStatus.DELIVERED);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        assertThrows(IllegalArgumentException.class,
                () -> orderService.updateStatus(orderId, OrderStatus.SHIPPED));
    }

    @Test
    void getOrderStatusInternal_ShouldExposeStatusAndDeliveryFlag() {
        order.setStatus(OrderStatus.DELIVERED);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));

        var status = orderService.getOrderStatusInternal(orderId);

        assertEquals("DELIVERED", status.get("status"));
        assertEquals("PENDING", status.get("paymentStatus"));
        assertEquals(Boolean.TRUE, status.get("delivered"));
    }
}
