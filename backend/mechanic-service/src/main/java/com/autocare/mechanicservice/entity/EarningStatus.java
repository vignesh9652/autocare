package com.autocare.mechanicservice.entity;

/**
 * Lifecycle of a mechanic's earning for one paid job.
 *
 * <ul>
 *   <li><b>PENDING</b> — the customer paid through AutoCare; the earning is
 *       recorded but not yet disbursed to the mechanic.</li>
 *   <li><b>PAID</b> — the earning has been settled (disbursed).</li>
 * </ul>
 */
public enum EarningStatus {
    PENDING,
    PAID
}
