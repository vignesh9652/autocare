package com.autocare.mechanicservice.service;

import com.autocare.mechanicservice.dto.EarningsSummaryResponse;
import com.autocare.mechanicservice.entity.EarningStatus;
import com.autocare.mechanicservice.entity.MechanicEarning;
import com.autocare.mechanicservice.repository.MechanicEarningRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MechanicEarningServiceTest {

    @Mock
    private MechanicEarningRepository earningRepository;

    private MechanicEarningService service;

    @BeforeEach
    void setUp() {
        service = new MechanicEarningService(earningRepository);
    }

    private Map<String, Object> paidEvent(Long bookingId) {
        return Map.of(
                "bookingId", bookingId,
                "mechanicId", 20L,
                "paymentId", 777L,
                "serviceAmount", 999.00,
                "platformCommission", 149.85,
                "mechanicEarning", 849.15
        );
    }

    // ─── RECORD (booking.paid event) ───────────────────────────────────

    @Test
    void recordEarning_ShouldSaveWithSplit() {
        when(earningRepository.existsByBookingId(100L)).thenReturn(false);

        service.recordEarning(paidEvent(100L));

        ArgumentCaptor<MechanicEarning> captor = ArgumentCaptor.forClass(MechanicEarning.class);
        verify(earningRepository).save(captor.capture());

        MechanicEarning saved = captor.getValue();
        assertEquals(20L, saved.getMechanicId());
        assertEquals(100L, saved.getBookingId());
        assertEquals(777L, saved.getPaymentId());
        assertEquals(0, new BigDecimal("999.00").compareTo(saved.getServiceAmount()));
        assertEquals(0, new BigDecimal("149.85").compareTo(saved.getPlatformCommission()));
        assertEquals(0, new BigDecimal("849.15").compareTo(saved.getMechanicEarning()));
        assertEquals(EarningStatus.PENDING, saved.getEarningStatus());
    }

    @Test
    void recordEarning_DuplicateBooking_ShouldSkip() {
        when(earningRepository.existsByBookingId(100L)).thenReturn(true);

        service.recordEarning(paidEvent(100L));

        verify(earningRepository, never()).save(any());
    }

    @Test
    void recordEarning_MissingIds_ShouldIgnore() {
        service.recordEarning(Map.of("bookingId", 100L));

        verify(earningRepository, never()).save(any());
    }

    // ─── SUMMARY ───────────────────────────────────────────────────────

    @Test
    void getEarningsSummary_ShouldComputeTotals() {
        MechanicEarning pending = new MechanicEarning(20L, 100L, 1L,
                new BigDecimal("999.00"), new BigDecimal("149.85"), new BigDecimal("849.15"));
        pending.setId(1L);

        MechanicEarning paid = new MechanicEarning(20L, 101L, 2L,
                new BigDecimal("500.00"), new BigDecimal("75.00"), new BigDecimal("425.00"));
        paid.setId(2L);
        paid.setEarningStatus(EarningStatus.PAID);

        when(earningRepository.findByMechanicIdOrderByCreatedAtDesc(20L))
                .thenReturn(List.of(pending, paid));

        EarningsSummaryResponse summary = service.getEarningsSummary(20L);

        assertEquals(0, new BigDecimal("1274.15").compareTo(summary.getTotalEarnings()));
        assertEquals(0, new BigDecimal("849.15").compareTo(summary.getPendingEarnings()));
        assertEquals(0, new BigDecimal("425.00").compareTo(summary.getCompletedEarnings()));
        assertEquals(0, new BigDecimal("849.15").compareTo(summary.getAvailableBalance()));
        assertEquals(2, summary.getEarnings().size());
        assertEquals(0, new BigDecimal("149.85").compareTo(summary.getEarnings().get(0).getPlatformCommission()));
    }
}
