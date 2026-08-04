package com.autocare.adminservice.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Aggregated admin dashboard summary.
 *
 * <p>Fields for downstream services that were unreachable are left at their
 * default (0 / empty) values and the service name is added to
 * {@code unavailableServices}.</p>
 */
public class DashboardResponse {

    private long totalUsers;
    private long totalMechanics;
    private long totalBookings;

    /** Booking status name (PENDING, ACCEPTED, ...) -> count. All statuses present, defaulting to 0. */
    private Map<String, Long> bookingsByStatus;

    /** Sum of all SUCCESS payment amounts. */
    private BigDecimal totalRevenue;

    /** Count of spare parts with stockQuantity &lt; 5. */
    private long lowStockPartsCount;

    /** Names of the downstream services that did not respond (lb:// names). */
    private List<String> unavailableServices;

    public DashboardResponse() {
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalMechanics() {
        return totalMechanics;
    }

    public void setTotalMechanics(long totalMechanics) {
        this.totalMechanics = totalMechanics;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(long totalBookings) {
        this.totalBookings = totalBookings;
    }

    public Map<String, Long> getBookingsByStatus() {
        return bookingsByStatus;
    }

    public void setBookingsByStatus(Map<String, Long> bookingsByStatus) {
        this.bookingsByStatus = bookingsByStatus;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getLowStockPartsCount() {
        return lowStockPartsCount;
    }

    public void setLowStockPartsCount(long lowStockPartsCount) {
        this.lowStockPartsCount = lowStockPartsCount;
    }

    public List<String> getUnavailableServices() {
        return unavailableServices;
    }

    public void setUnavailableServices(List<String> unavailableServices) {
        this.unavailableServices = unavailableServices;
    }
}
