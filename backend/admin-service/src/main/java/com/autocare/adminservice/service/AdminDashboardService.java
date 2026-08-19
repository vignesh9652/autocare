package com.autocare.adminservice.service;

import com.autocare.adminservice.client.BookingServiceClient;
import com.autocare.adminservice.client.MechanicServiceClient;
import com.autocare.adminservice.client.PaymentServiceClient;
import com.autocare.adminservice.client.ReviewServiceClient;
import com.autocare.adminservice.client.SparePartsServiceClient;
import com.autocare.adminservice.client.UserServiceClient;
import com.autocare.adminservice.client.VehicleServiceClient;
import com.autocare.adminservice.client.WalletServiceClient;
import com.autocare.adminservice.dto.DashboardResponse;
import com.autocare.adminservice.dto.ServiceResult;
import com.autocare.adminservice.exception.ServiceUnavailableException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Aggregation layer that combines data from all downstream services into an
 * admin dashboard.
 *
 * <p>Each downstream call goes through a WebClient client annotated with
 * Resilience4j {@code @CircuitBreaker}. When a downstream service is down the
 * client's fallback returns {@link ServiceResult#unavailable()}, so the
 * dashboard is still returned with a partial result plus the affected service
 * listed in {@code unavailableServices}.</p>
 */
@Service
public class AdminDashboardService {

    private static final BigDecimal LOW_STOCK_THRESHOLD = new BigDecimal("5");
    private static final String STATUS_SUCCESS = "SUCCESS";

    private static final List<String> BOOKING_STATUSES =
            List.of("PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "PAYMENT_PENDING", "PAID", "CANCELLED");

    private final UserServiceClient userServiceClient;
    private final VehicleServiceClient vehicleServiceClient;
    private final MechanicServiceClient mechanicServiceClient;
    private final BookingServiceClient bookingServiceClient;
    private final PaymentServiceClient paymentServiceClient;
    private final SparePartsServiceClient sparePartsServiceClient;
    private final ReviewServiceClient reviewServiceClient;
    private final WalletServiceClient walletServiceClient;

    public AdminDashboardService(UserServiceClient userServiceClient,
                                 VehicleServiceClient vehicleServiceClient,
                                 MechanicServiceClient mechanicServiceClient,
                                 BookingServiceClient bookingServiceClient,
                                 PaymentServiceClient paymentServiceClient,
                                 SparePartsServiceClient sparePartsServiceClient,
                                 ReviewServiceClient reviewServiceClient,
                                 WalletServiceClient walletServiceClient) {
        this.userServiceClient = userServiceClient;
        this.vehicleServiceClient = vehicleServiceClient;
        this.mechanicServiceClient = mechanicServiceClient;
        this.bookingServiceClient = bookingServiceClient;
        this.paymentServiceClient = paymentServiceClient;
        this.sparePartsServiceClient = sparePartsServiceClient;
        this.reviewServiceClient = reviewServiceClient;
        this.walletServiceClient = walletServiceClient;
    }

    /**
     * Builds the aggregate admin dashboard. If a downstream service is
     * unreachable its metric is left at a default and the service name is
     * added to {@code unavailableServices} — the request never fails outright
     * because of a single service being down.
     */
    public DashboardResponse buildDashboard(String authHeader) {
        DashboardResponse dashboard = new DashboardResponse();
        List<String> unavailable = new ArrayList<>();

        // ── Total users + customers + pending mechanic approvals ────────────
        ServiceResult<List<Map<String, Object>>> users = userServiceClient.getUsers(authHeader);
        if (users.isAvailable()) {
            List<Map<String, Object>> userList = users.getData();
            dashboard.setTotalUsers(userList.size());
            dashboard.setTotalCustomers(userList.stream()
                    .filter(u -> "CUSTOMER".equals(String.valueOf(u.get("role"))))
                    .count());
            dashboard.setPendingMechanicApprovals(userList.stream()
                    .filter(u -> "MECHANIC".equals(String.valueOf(u.get("role")))
                            && "PENDING".equals(String.valueOf(u.get("status"))))
                    .count());
        } else {
            unavailable.add("user-service");
        }

        // ── Total mechanics ────────────────────────────────────────────────
        ServiceResult<List<Map<String, Object>>> mechanics = mechanicServiceClient.getAllMechanics();
        if (mechanics.isAvailable()) {
            dashboard.setTotalMechanics(mechanics.getData().size());
        } else {
            unavailable.add("mechanic-service");
        }

        // ── Total bookings + breakdown by status + revenue split ───────────
        Map<String, Long> bookingsByStatus = new LinkedHashMap<>();
        BOOKING_STATUSES.forEach(status -> bookingsByStatus.put(status, 0L));
        dashboard.setBookingsByStatus(bookingsByStatus);

        BigDecimal totalServiceRevenue = BigDecimal.ZERO;
        BigDecimal platformCommission = BigDecimal.ZERO;
        BigDecimal mechanicEarnings = BigDecimal.ZERO;

        ServiceResult<List<Map<String, Object>>> bookings = bookingServiceClient.getAllBookings(authHeader);
        if (bookings.isAvailable()) {
            dashboard.setTotalBookings(bookings.getData().size());
            for (Map<String, Object> booking : bookings.getData()) {
                String status = String.valueOf(booking.get("status"));
                bookingsByStatus.merge(status, 1L, Long::sum);

                // Only paid bookings carry the final money split
                if ("PAID".equals(status)) {
                    totalServiceRevenue = totalServiceRevenue.add(toBigDecimal(booking.get("finalAmount")));
                    platformCommission = platformCommission.add(toBigDecimal(booking.get("platformCommission")));
                    mechanicEarnings = mechanicEarnings.add(toBigDecimal(booking.get("mechanicEarning")));
                }
            }
        } else {
            unavailable.add("booking-service");
        }
        dashboard.setTotalServiceRevenue(totalServiceRevenue);
        dashboard.setPlatformCommission(platformCommission);
        dashboard.setMechanicEarnings(mechanicEarnings);

        // ── Total revenue + payment status counts ──────────────────────────
        ServiceResult<List<Map<String, Object>>> payments = paymentServiceClient.getAllTransactions(authHeader);
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long successful = 0, pending = 0, failed = 0;
        if (payments.isAvailable()) {
            for (Map<String, Object> payment : payments.getData()) {
                String paymentStatus = String.valueOf(payment.get("status"));
                if (STATUS_SUCCESS.equals(paymentStatus)) {
                    totalRevenue = totalRevenue.add(toBigDecimal(payment.get("amount")));
                    successful++;
                } else if ("INITIATED".equals(paymentStatus)) {
                    pending++;
                } else if ("FAILED".equals(paymentStatus)) {
                    failed++;
                }
            }
        } else {
            unavailable.add("payment-service");
        }
        dashboard.setTotalRevenue(totalRevenue);
        dashboard.setSuccessfulPayments(successful);
        dashboard.setPendingPayments(pending);
        dashboard.setFailedPayments(failed);

        // ── Low-stock spare parts (stockQuantity < 5) ──────────────────────
        ServiceResult<List<Map<String, Object>>> parts = sparePartsServiceClient.getAllParts();
        long lowStockCount = 0;
        if (parts.isAvailable()) {
            for (Map<String, Object> part : parts.getData()) {
                if (toBigDecimal(part.get("stockQuantity")).compareTo(LOW_STOCK_THRESHOLD) < 0) {
                    lowStockCount++;
                }
            }
        } else {
            unavailable.add("spareparts-service");
        }
        dashboard.setLowStockPartsCount(lowStockCount);

        dashboard.setUnavailableServices(unavailable);
        return dashboard;
    }

    // ── Proxy endpoints used by AdminController ────────────────────────────

    public List<Map<String, Object>> getPendingMechanics(String authHeader) {
        ServiceResult<List<Map<String, Object>>> result = userServiceClient.getPendingMechanics(authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("user-service is temporarily unavailable");
        }
        return result.getData();
    }

    public Map<String, Object> approveMechanic(Long id, String authHeader) {
        ServiceResult<Map<String, Object>> result = userServiceClient.approveMechanic(id, authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("user-service is temporarily unavailable");
        }
        return result.getData();
    }

    public Map<String, Object> rejectMechanic(Long id, String authHeader) {
        ServiceResult<Map<String, Object>> result = userServiceClient.rejectMechanic(id, authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("user-service is temporarily unavailable");
        }
        return result.getData();
    }

    public List<Map<String, Object>> getAllBookings(String authHeader) {
        ServiceResult<List<Map<String, Object>>> result = bookingServiceClient.getAllBookings(authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("booking-service is temporarily unavailable");
        }
        return result.getData();
    }

    public List<Map<String, Object>> getAllMechanics() {
        ServiceResult<List<Map<String, Object>>> result = mechanicServiceClient.getAllMechanics();
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("mechanic-service is temporarily unavailable");
        }
        return result.getData();
    }

    public List<Map<String, Object>> getAllTransactions(String authHeader) {
        ServiceResult<List<Map<String, Object>>> result = paymentServiceClient.getAllTransactions(authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("payment-service is temporarily unavailable");
        }
        return result.getData();
    }

    public List<Map<String, Object>> getMechanicReviews(Long mechanicId, String authHeader) {
        ServiceResult<List<Map<String, Object>>> result = reviewServiceClient.getReviewsByMechanic(mechanicId, authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("review-service is temporarily unavailable");
        }
        return result.getData();
    }

    public ServiceResult<Map<String, Object>> getVehicle(Long vehicleId) {
        return vehicleServiceClient.getVehicleById(vehicleId);
    }

    // ── Wallet proxies (module lives in booking-service) ───────────────────

    public Map<String, Object> getAdminWallet(String authHeader) {
        ServiceResult<Map<String, Object>> result = walletServiceClient.getAdminWallet(authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("booking-service is temporarily unavailable");
        }
        return result.getData();
    }

    public List<Map<String, Object>> getAdminWalletTransactions(String authHeader) {
        ServiceResult<List<Map<String, Object>>> result = walletServiceClient.getAdminTransactions(authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("booking-service is temporarily unavailable");
        }
        return result.getData();
    }

    public List<Map<String, Object>> getWithdrawals(String authHeader, String status) {
        ServiceResult<List<Map<String, Object>>> result = walletServiceClient.getWithdrawals(authHeader, status);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("booking-service is temporarily unavailable");
        }
        return result.getData();
    }

    public Map<String, Object> approveWithdrawal(Long id, String authHeader) {
        ServiceResult<Map<String, Object>> result = walletServiceClient.approveWithdrawal(id, authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("booking-service is temporarily unavailable");
        }
        return result.getData();
    }

    public Map<String, Object> rejectWithdrawal(Long id, String authHeader) {
        ServiceResult<Map<String, Object>> result = walletServiceClient.rejectWithdrawal(id, authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("booking-service is temporarily unavailable");
        }
        return result.getData();
    }

    public Map<String, Object> refundBooking(Long bookingId, String authHeader) {
        ServiceResult<Map<String, Object>> result = walletServiceClient.refundBooking(bookingId, authHeader);
        if (!result.isAvailable()) {
            throw new ServiceUnavailableException("booking-service is temporarily unavailable");
        }
        return result.getData();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        try {
            return new BigDecimal(String.valueOf(value));
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }
}
