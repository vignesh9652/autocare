package com.autocare.bookingservice.entity;

/**
 * Lifecycle of an additional-service request raised by the mechanic during
 * vehicle inspection.
 *
 * <pre>
 *   PENDING ──► APPROVED   (customer approved → mechanic may perform the work)
 *   PENDING ──► REJECTED   (customer rejected → mechanic must not perform it)
 * </pre>
 *
 * Only APPROVED requests contribute to the booking's final amount.
 */
public enum AdditionalServiceStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED
}
