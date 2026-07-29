package com.autocare.sparepartsservice.service;

import com.autocare.sparepartsservice.dto.RecommendationDecisionRequest;
import com.autocare.sparepartsservice.dto.RecommendationRequest;
import com.autocare.sparepartsservice.entity.PartRecommendation;
import com.autocare.sparepartsservice.entity.RecommendationStatus;
import com.autocare.sparepartsservice.entity.SparePart;
import com.autocare.sparepartsservice.exception.InsufficientStockException;
import com.autocare.sparepartsservice.exception.RecommendationAlreadyDecidedException;
import com.autocare.sparepartsservice.exception.RecommendationNotFoundException;
import com.autocare.sparepartsservice.exception.SparePartNotFoundException;
import com.autocare.sparepartsservice.repository.PartRecommendationRepository;
import com.autocare.sparepartsservice.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.OptimisticLockingFailureException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RecommendationServiceTest {

    @Mock
    private PartRecommendationRepository recommendationRepository;

    @Mock
    private SparePartRepository sparePartRepository;

    private RecommendationService recommendationService;

    @BeforeEach
    void setUp() {
        recommendationService = new RecommendationService(recommendationRepository, sparePartRepository);
    }

    @Test
    void createRecommendation_ShouldReturnRecommendation() {
        SparePart sparePart = new SparePart("Brake Pad Set", "desc",
                List.of("Camry"), new BigDecimal("89.99"), 50, "BRAKES");
        sparePart.setId(200L);
        sparePart.setCreatedAt(LocalDateTime.now());

        PartRecommendation savedRec = new PartRecommendation(100L, 10L, sparePart, 2,
                "Brake pads worn");
        savedRec.setId(300L);
        savedRec.setStatus(RecommendationStatus.RECOMMENDED);

        RecommendationRequest req = new RecommendationRequest();
        req.setBookingId(100L);
        req.setSparePartId(200L);
        req.setQuantity(2);
        req.setReason("Brake pads worn");

        when(sparePartRepository.findById(any())).thenReturn(Optional.of(sparePart));
        when(recommendationRepository.save(any())).thenReturn(savedRec);

        PartRecommendation result = recommendationService.createRecommendation(10L, req);

        assertNotNull(result);
        assertEquals(300L, result.getId());
        assertEquals(100L, result.getBookingId());
        assertEquals(10L, result.getMechanicId());
        assertEquals(RecommendationStatus.RECOMMENDED, result.getStatus());
        assertEquals(2, result.getQuantity());
    }

    @Test
    void createRecommendation_PartNotFound() {
        when(sparePartRepository.findById(any())).thenReturn(Optional.empty());

        RecommendationRequest req = new RecommendationRequest();
        req.setSparePartId(999L);
        req.setQuantity(1);

        assertThrows(SparePartNotFoundException.class,
                () -> recommendationService.createRecommendation(1L, req));
    }

    @Test
    void createRecommendation_InsufficientStock() {
        SparePart sparePart = new SparePart("Part", "desc",
                null, BigDecimal.TEN, 1, "ENGINE");
        sparePart.setId(1L);
        sparePart.setCreatedAt(LocalDateTime.now());

        when(sparePartRepository.findById(any())).thenReturn(Optional.of(sparePart));

        RecommendationRequest req = new RecommendationRequest();
        req.setSparePartId(1L);
        req.setQuantity(5);

        assertThrows(InsufficientStockException.class,
                () -> recommendationService.createRecommendation(1L, req));
    }

    @Test
    void getRecommendationsByBooking_ShouldReturnList() {
        PartRecommendation rec1 = new PartRecommendation();
        rec1.setId(1L);
        PartRecommendation rec2 = new PartRecommendation();
        rec2.setId(2L);

        when(recommendationRepository.findByBookingId(100L)).thenReturn(List.of(rec1, rec2));

        List<PartRecommendation> results = recommendationService.getRecommendationsByBooking(100L);
        assertEquals(2, results.size());
    }

    @Test
    void getRecommendationsByBooking_ShouldReturnEmptyList() {
        when(recommendationRepository.findByBookingId(100L)).thenReturn(List.of());
        assertTrue(recommendationService.getRecommendationsByBooking(100L).isEmpty());
    }

    @Test
    void decideRecommendation_Approve_ShouldDecrementStock() {
        SparePart sparePart = new SparePart("Part", null,
                null, BigDecimal.TEN, 10, "ENGINE");
        sparePart.setId(1L);
        sparePart.setCreatedAt(LocalDateTime.now());

        PartRecommendation rec = new PartRecommendation(100L, 10L, sparePart, 3, "needs part");
        rec.setId(300L);
        rec.setStatus(RecommendationStatus.RECOMMENDED);

        when(recommendationRepository.findById(any())).thenReturn(Optional.of(rec));

        SparePart decremented = new SparePart("Part", null, null, BigDecimal.TEN, 7, "ENGINE");
        decremented.setId(1L);
        when(sparePartRepository.save(any())).thenReturn(decremented);

        PartRecommendation ordered = new PartRecommendation(100L, 10L, decremented, 3, "needs part");
        ordered.setId(300L);
        ordered.setStatus(RecommendationStatus.ORDERED);
        ordered.setDecidedAt(LocalDateTime.now());
        when(recommendationRepository.save(any())).thenReturn(ordered);

        RecommendationDecisionRequest decision = new RecommendationDecisionRequest();
        decision.setStatus(RecommendationStatus.APPROVED);

        PartRecommendation result = recommendationService.decideRecommendation(300L, decision);

        assertEquals(RecommendationStatus.ORDERED, result.getStatus());
        assertNotNull(result.getDecidedAt());
        assertEquals(7, result.getSparePart().getStockQuantity());
    }

    @Test
    void decideRecommendation_Approve_InsufficientStock() {
        SparePart sparePart = new SparePart("Part", null,
                null, BigDecimal.TEN, 2, "ENGINE");
        sparePart.setId(1L);
        sparePart.setCreatedAt(LocalDateTime.now());

        PartRecommendation rec = new PartRecommendation(100L, 10L, sparePart, 5, "needs part");
        rec.setId(300L);
        rec.setStatus(RecommendationStatus.RECOMMENDED);

        when(recommendationRepository.findById(any())).thenReturn(Optional.of(rec));

        RecommendationDecisionRequest decision = new RecommendationDecisionRequest();
        decision.setStatus(RecommendationStatus.APPROVED);

        assertThrows(InsufficientStockException.class,
                () -> recommendationService.decideRecommendation(300L, decision));
    }

    @Test
    void decideRecommendation_Approve_OptimisticLockFailure() {
        SparePart sparePart = new SparePart("Part", null,
                null, BigDecimal.TEN, 10, "ENGINE");
        sparePart.setId(1L);
        sparePart.setCreatedAt(LocalDateTime.now());

        PartRecommendation rec = new PartRecommendation(100L, 10L, sparePart, 3, "needs part");
        rec.setId(300L);
        rec.setStatus(RecommendationStatus.RECOMMENDED);

        when(recommendationRepository.findById(any())).thenReturn(Optional.of(rec));
        when(sparePartRepository.save(any())).thenThrow(new OptimisticLockingFailureException("lock"));

        RecommendationDecisionRequest decision = new RecommendationDecisionRequest();
        decision.setStatus(RecommendationStatus.APPROVED);

        assertThrows(OptimisticLockingFailureException.class,
                () -> recommendationService.decideRecommendation(300L, decision));
    }

    @Test
    void decideRecommendation_Reject_ShouldSetRejected() {
        SparePart sparePart = new SparePart("Part", null,
                null, BigDecimal.TEN, 10, "ENGINE");
        sparePart.setId(1L);
        sparePart.setCreatedAt(LocalDateTime.now());

        PartRecommendation rec = new PartRecommendation(100L, 10L, sparePart, 3, "needs part");
        rec.setId(300L);
        rec.setStatus(RecommendationStatus.RECOMMENDED);

        when(recommendationRepository.findById(any())).thenReturn(Optional.of(rec));

        PartRecommendation rejected = new PartRecommendation(100L, 10L, sparePart, 3, "needs part");
        rejected.setId(300L);
        rejected.setStatus(RecommendationStatus.REJECTED);
        rejected.setDecidedAt(LocalDateTime.now());
        when(recommendationRepository.save(any())).thenReturn(rejected);

        RecommendationDecisionRequest decision = new RecommendationDecisionRequest();
        decision.setStatus(RecommendationStatus.REJECTED);

        PartRecommendation result = recommendationService.decideRecommendation(300L, decision);

        assertEquals(RecommendationStatus.REJECTED, result.getStatus());
        assertNotNull(result.getDecidedAt());
    }

    @Test
    void decideRecommendation_WhenAlreadyApproved_ShouldThrow() {
        PartRecommendation rec = new PartRecommendation();
        rec.setId(1L);
        rec.setStatus(RecommendationStatus.APPROVED);

        when(recommendationRepository.findById(any())).thenReturn(Optional.of(rec));

        RecommendationDecisionRequest decision = new RecommendationDecisionRequest();
        decision.setStatus(RecommendationStatus.APPROVED);

        assertThrows(RecommendationAlreadyDecidedException.class,
                () -> recommendationService.decideRecommendation(1L, decision));
    }

    @Test
    void decideRecommendation_WithNonExistentId_ShouldThrow() {
        when(recommendationRepository.findById(any())).thenReturn(Optional.empty());

        RecommendationDecisionRequest decision = new RecommendationDecisionRequest();
        decision.setStatus(RecommendationStatus.APPROVED);

        assertThrows(RecommendationNotFoundException.class,
                () -> recommendationService.decideRecommendation(999L, decision));
    }

    @Test
    void decideRecommendation_WithInvalidStatus_ShouldThrow() {
        PartRecommendation rec = new PartRecommendation();
        rec.setId(1L);
        rec.setStatus(RecommendationStatus.RECOMMENDED);

        when(recommendationRepository.findById(any())).thenReturn(Optional.of(rec));

        RecommendationDecisionRequest decision = new RecommendationDecisionRequest();
        decision.setStatus(RecommendationStatus.RECOMMENDED);

        assertThrows(IllegalArgumentException.class,
                () -> recommendationService.decideRecommendation(1L, decision));
    }

    @Test
    void decideRecommendation_WithOrderedAsDecision_ShouldThrow() {
        PartRecommendation rec = new PartRecommendation();
        rec.setId(1L);
        rec.setStatus(RecommendationStatus.RECOMMENDED);

        when(recommendationRepository.findById(any())).thenReturn(Optional.of(rec));

        RecommendationDecisionRequest decision = new RecommendationDecisionRequest();
        decision.setStatus(RecommendationStatus.ORDERED);

        assertThrows(IllegalArgumentException.class,
                () -> recommendationService.decideRecommendation(1L, decision));
    }
}
