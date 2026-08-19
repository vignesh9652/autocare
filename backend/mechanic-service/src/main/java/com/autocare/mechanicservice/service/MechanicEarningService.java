package com.autocare.mechanicservice.service;

import com.autocare.mechanicservice.dto.EarningsSummaryResponse;
import com.autocare.mechanicservice.dto.MechanicEarningResponse;
import com.autocare.mechanicservice.entity.EarningStatus;
import com.autocare.mechanicservice.entity.MechanicEarning;
import com.autocare.mechanicservice.repository.MechanicEarningRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MechanicEarningService {

    private static final Logger log = LoggerFactory.getLogger(MechanicEarningService.class);

    private final MechanicEarningRepository earningRepository;

    public MechanicEarningService(MechanicEarningRepository earningRepository) {
        this.earningRepository = earningRepository;
    }

    /**
     * Records a mechanic's earning from a {@code booking.paid} event. The
     * unique bookingId makes this idempotent — a replayed/duplicated event
     * cannot double-credit the mechanic.
     */
    @Transactional
    public void recordEarning(Map<String, Object> event) {
        Long bookingId = number(event, "bookingId");
        Long mechanicId = number(event, "mechanicId");
        Long paymentId = number(event, "paymentId");

        if (bookingId == null || mechanicId == null || paymentId == null) {
            log.warn("⚠️ booking.paid event missing required ids — ignoring: {}", event);
            return;
        }
        if (earningRepository.existsByBookingId(bookingId)) {
            log.info("🔄 Earning for booking #{} already recorded — skipping duplicate", bookingId);
            return;
        }

        BigDecimal serviceAmount = decimal(event, "serviceAmount");
        BigDecimal commission = decimal(event, "platformCommission");
        BigDecimal earning = decimal(event, "mechanicEarning");
        if (serviceAmount == null || commission == null || earning == null) {
            log.warn("⚠️ booking.paid event missing money fields — ignoring: {}", event);
            return;
        }

        earningRepository.save(new MechanicEarning(
                mechanicId, bookingId, paymentId, serviceAmount, commission, earning));
        log.info("💰 Earning recorded for mechanic #{} · booking #{} · ₹{} (commission ₹{})",
                mechanicId, bookingId, earning, commission);
    }

    /** Summary + recent earnings for a mechanic's dashboard. */
    @Transactional(readOnly = true)
    public EarningsSummaryResponse getEarningsSummary(Long mechanicId) {
        List<MechanicEarning> earnings =
                earningRepository.findByMechanicIdOrderByCreatedAtDesc(mechanicId);

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal pending = BigDecimal.ZERO;
        BigDecimal completed = BigDecimal.ZERO;
        for (MechanicEarning e : earnings) {
            total = total.add(e.getMechanicEarning());
            if (e.getEarningStatus() == EarningStatus.PENDING) {
                pending = pending.add(e.getMechanicEarning());
            } else {
                completed = completed.add(e.getMechanicEarning());
            }
        }

        List<MechanicEarningResponse> responses = earnings.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return new EarningsSummaryResponse(total, pending, completed, pending, responses);
    }

    private MechanicEarningResponse toResponse(MechanicEarning earning) {
        return new MechanicEarningResponse(
                earning.getId(),
                earning.getBookingId(),
                earning.getPaymentId(),
                earning.getServiceAmount(),
                earning.getPlatformCommission(),
                earning.getMechanicEarning(),
                earning.getEarningStatus(),
                earning.getCreatedAt()
        );
    }

    private Long number(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n) {
            return n.longValue();
        }
        if (val instanceof String s) {
            try {
                return Long.parseLong(s);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    private BigDecimal decimal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof BigDecimal bd) {
            return bd;
        }
        if (val instanceof Number n) {
            return new BigDecimal(n.toString());
        }
        if (val instanceof String s) {
            try {
                return new BigDecimal(s);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
}
