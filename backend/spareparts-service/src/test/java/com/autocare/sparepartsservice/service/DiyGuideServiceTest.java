package com.autocare.sparepartsservice.service;

import com.autocare.sparepartsservice.dto.DiyGuideRequest;
import com.autocare.sparepartsservice.dto.DiyGuideResponse;
import com.autocare.sparepartsservice.dto.DiyStepRequest;
import com.autocare.sparepartsservice.dto.DiyStepResponse;
import com.autocare.sparepartsservice.entity.DifficultyLevel;
import com.autocare.sparepartsservice.entity.DiyStatus;
import com.autocare.sparepartsservice.entity.DIYGuide;
import com.autocare.sparepartsservice.entity.DIYStep;
import com.autocare.sparepartsservice.exception.DiyGuideNotFoundException;
import com.autocare.sparepartsservice.exception.SparePartNotFoundException;
import com.autocare.sparepartsservice.repository.DiyGuideRepository;
import com.autocare.sparepartsservice.repository.DiyStepRepository;
import com.autocare.sparepartsservice.repository.SparePartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiyGuideServiceTest {

    @Mock
    private DiyGuideRepository diyGuideRepository;

    @Mock
    private DiyStepRepository diyStepRepository;

    @Mock
    private SparePartRepository sparePartRepository;

    private DiyGuideService diyGuideService;

    private final Long partId = 100L;
    private final Long guideId = 200L;
    private final Long stepId = 300L;

    private DIYGuide publishedGuide;
    private DIYStep step;

    @BeforeEach
    void setUp() {
        diyGuideService = new DiyGuideService(diyGuideRepository, diyStepRepository, sparePartRepository);

        publishedGuide = new DIYGuide();
        publishedGuide.setId(guideId);
        publishedGuide.setSparePartId(partId);
        publishedGuide.setTitle("Brake Pad Replacement");
        publishedGuide.setDifficultyLevel(DifficultyLevel.MEDIUM);
        publishedGuide.setEstimatedTimeMinutes(45);
        publishedGuide.setRequiredTools(List.of("Socket wrench", "Jack"));
        publishedGuide.setSafetyWarnings(List.of("Park on a flat surface"));
        publishedGuide.setStatus(DiyStatus.PUBLISHED);
        publishedGuide.setCreatedAt(LocalDateTime.now());
        publishedGuide.setUpdatedAt(LocalDateTime.now());

        step = new DIYStep();
        step.setId(stepId);
        step.setDiyGuideId(guideId);
        step.setStepNumber(1);
        step.setTitle("Prepare the vehicle");
        step.setDescription("Park on a flat surface.");
    }

    // ─── CUSTOMER (published only) ─────────────────────────────────────

    @Test
    void getPublishedGuideForPart_ShouldReturnOnlyPublished() {
        when(sparePartRepository.existsById(partId)).thenReturn(true);
        when(diyGuideRepository.findBySparePartIdAndStatus(partId, DiyStatus.PUBLISHED))
                .thenReturn(Optional.of(publishedGuide));
        when(diyStepRepository.findByDiyGuideIdOrderByStepNumberAsc(guideId))
                .thenReturn(List.of(step));

        DiyGuideResponse response = diyGuideService.getPublishedGuideForPart(partId);

        assertEquals(guideId, response.getId());
        assertEquals("Brake Pad Replacement", response.getTitle());
        assertEquals(DiyStatus.PUBLISHED, response.getStatus());
        assertEquals(1, response.getSteps().size());
        assertEquals("Prepare the vehicle", response.getSteps().get(0).getTitle());
    }

    @Test
    void getPublishedGuideForPart_WhenOnlyDraftExists_ShouldThrow() {
        when(sparePartRepository.existsById(partId)).thenReturn(true);
        when(diyGuideRepository.findBySparePartIdAndStatus(partId, DiyStatus.PUBLISHED))
                .thenReturn(Optional.empty());

        assertThrows(DiyGuideNotFoundException.class,
                () -> diyGuideService.getPublishedGuideForPart(partId));
    }

    @Test
    void getPublishedGuideForPart_UnknownPart_ShouldThrow() {
        when(sparePartRepository.existsById(999L)).thenReturn(false);

        assertThrows(SparePartNotFoundException.class,
                () -> diyGuideService.getPublishedGuideForPart(999L));
    }

    @Test
    void getPublishedStepsForPart_ShouldReturnOrderedSteps() {
        when(sparePartRepository.existsById(partId)).thenReturn(true);
        when(diyGuideRepository.findBySparePartIdAndStatus(partId, DiyStatus.PUBLISHED))
                .thenReturn(Optional.of(publishedGuide));
        when(diyStepRepository.findByDiyGuideIdOrderByStepNumberAsc(guideId))
                .thenReturn(List.of(step));

        List<DiyStepResponse> steps = diyGuideService.getPublishedStepsForPart(partId);

        assertEquals(1, steps.size());
        assertEquals(stepId, steps.get(0).getId());
    }

    // ─── ADMIN ─────────────────────────────────────────────────────────

    @Test
    void createGuide_ShouldSaveGuideAndSteps() {
        DiyGuideRequest request = new DiyGuideRequest();
        request.setSparePartId(partId);
        request.setTitle("Oil Filter Change");
        request.setDifficultyLevel("EASY");
        request.setEstimatedTimeMinutes(20);
        request.setRequiredTools(List.of("Oil filter wrench"));
        request.setSafetyWarnings(List.of("Engine must be cool"));

        DiyStepRequest stepRequest = new DiyStepRequest();
        stepRequest.setStepNumber(1);
        stepRequest.setTitle("Drain the oil");

        request.setSteps(List.of(stepRequest));

        when(sparePartRepository.existsById(partId)).thenReturn(true);
        when(diyGuideRepository.findBySparePartId(partId)).thenReturn(Optional.empty());
        when(diyGuideRepository.save(any(DIYGuide.class)))
                .thenAnswer(inv -> { DIYGuide g = inv.getArgument(0); g.setId(guideId); return g; });
        when(diyStepRepository.save(any(DIYStep.class))).thenAnswer(inv -> inv.getArgument(0));
        when(diyStepRepository.findByDiyGuideIdOrderByStepNumberAsc(guideId))
                .thenReturn(List.of(step));

        DiyGuideResponse response = diyGuideService.createGuide(request);

        assertEquals("Oil Filter Change", response.getTitle());
        assertEquals(DifficultyLevel.EASY, response.getDifficultyLevel());
        assertEquals(DiyStatus.DRAFT, response.getStatus());
        verify(diyGuideRepository).save(any(DIYGuide.class));
        verify(diyStepRepository).save(any(DIYStep.class));
    }

    @Test
    void createGuide_ForPartThatAlreadyHasGuide_ShouldReject() {
        DiyGuideRequest request = new DiyGuideRequest();
        request.setSparePartId(partId);
        request.setTitle("Duplicate Guide");

        when(sparePartRepository.existsById(partId)).thenReturn(true);
        when(diyGuideRepository.findBySparePartId(partId)).thenReturn(Optional.of(publishedGuide));

        assertThrows(IllegalArgumentException.class,
                () -> diyGuideService.createGuide(request));
    }

    @Test
    void publishGuide_ShouldUpdateStatus() {
        DIYGuide draft = new DIYGuide();
        draft.setId(guideId);
        draft.setStatus(DiyStatus.DRAFT);
        when(diyGuideRepository.findById(guideId)).thenReturn(Optional.of(draft));
        when(diyGuideRepository.save(any(DIYGuide.class))).thenAnswer(inv -> inv.getArgument(0));
        when(diyStepRepository.findByDiyGuideIdOrderByStepNumberAsc(guideId)).thenReturn(List.of());

        DiyGuideResponse response = diyGuideService.setStatus(guideId, DiyStatus.PUBLISHED);

        assertEquals(DiyStatus.PUBLISHED, response.getStatus());
        verify(diyGuideRepository).save(any(DIYGuide.class));
    }

    @Test
    void updateGuide_ShouldReplaceSteps() {
        when(diyGuideRepository.findById(guideId)).thenReturn(Optional.of(publishedGuide));
        when(diyGuideRepository.save(any(DIYGuide.class))).thenAnswer(inv -> inv.getArgument(0));
        when(diyStepRepository.findByDiyGuideIdOrderByStepNumberAsc(guideId))
                .thenReturn(List.of(step));
        doNothing().when(diyStepRepository).deleteByDiyGuideId(guideId);

        DiyGuideRequest request = new DiyGuideRequest();
        request.setTitle("Updated Title");
        request.setDifficultyLevel("HARD");
        request.setEstimatedTimeMinutes(60);
        request.setSteps(List.of());

        DiyGuideResponse response = diyGuideService.updateGuide(guideId, request);

        assertEquals("Updated Title", response.getTitle());
        assertEquals(DifficultyLevel.HARD, response.getDifficultyLevel());
        verify(diyStepRepository).deleteByDiyGuideId(guideId);
        verify(diyGuideRepository).save(any(DIYGuide.class));
    }

    @Test
    void deleteGuide_ShouldDeleteStepsAndGuide() {
        when(diyGuideRepository.findById(guideId)).thenReturn(Optional.of(publishedGuide));
        doNothing().when(diyStepRepository).deleteByDiyGuideId(guideId);
        doNothing().when(diyGuideRepository).deleteById(guideId);

        diyGuideService.deleteGuide(guideId);

        verify(diyStepRepository).deleteByDiyGuideId(guideId);
        verify(diyGuideRepository).deleteById(guideId);
    }

    @Test
    void addStep_ShouldCreateStepUnderGuide() {
        when(diyGuideRepository.findById(guideId)).thenReturn(Optional.of(publishedGuide));
        when(diyStepRepository.save(any(DIYStep.class))).thenAnswer(inv -> inv.getArgument(0));

        DiyStepRequest stepRequest = new DiyStepRequest();
        stepRequest.setStepNumber(2);
        stepRequest.setTitle("Remove the old part");

        DiyStepResponse response = diyGuideService.addStep(guideId, stepRequest);

        assertEquals(2, response.getStepNumber());
        assertEquals("Remove the old part", response.getTitle());
        verify(diyStepRepository).save(any(DIYStep.class));
    }

    @Test
    void getGuide_WithUnknownId_ShouldThrow() {
        when(diyGuideRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(DiyGuideNotFoundException.class, () -> diyGuideService.getGuide(999L));
    }
}
