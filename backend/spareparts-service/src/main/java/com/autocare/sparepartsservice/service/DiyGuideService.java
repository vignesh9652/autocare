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
import com.autocare.sparepartsservice.exception.DiyStepNotFoundException;
import com.autocare.sparepartsservice.exception.SparePartNotFoundException;
import com.autocare.sparepartsservice.repository.DiyGuideRepository;
import com.autocare.sparepartsservice.repository.DiyStepRepository;
import com.autocare.sparepartsservice.repository.SparePartRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * DIY installation guides for spare parts.
 *
 * <p>Customers only ever see {@link DiyStatus#PUBLISHED} guides; the admin
 * endpoints manage drafts, steps, images and publication.</p>
 */
@Service
public class DiyGuideService {

    private final DiyGuideRepository diyGuideRepository;
    private final DiyStepRepository diyStepRepository;
    private final SparePartRepository sparePartRepository;

    public DiyGuideService(DiyGuideRepository diyGuideRepository,
                           DiyStepRepository diyStepRepository,
                           SparePartRepository sparePartRepository) {
        this.diyGuideRepository = diyGuideRepository;
        this.diyStepRepository = diyStepRepository;
        this.sparePartRepository = sparePartRepository;
    }

    // ─── Customer-facing ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DiyGuideResponse getPublishedGuideForPart(Long sparePartId) {
        return toResponse(findPublishedGuide(sparePartId));
    }

    @Transactional(readOnly = true)
    public List<DiyStepResponse> getPublishedStepsForPart(Long sparePartId) {
        DIYGuide guide = findPublishedGuide(sparePartId);
        return getSteps(guide.getId());
    }

    private DIYGuide findPublishedGuide(Long sparePartId) {
        ensureSparePartExists(sparePartId);
        return diyGuideRepository.findBySparePartIdAndStatus(
                        sparePartId, DiyStatus.PUBLISHED)
                .orElseThrow(() -> new DiyGuideNotFoundException(
                        "No published DIY guide found for spare part: " + sparePartId));
    }

    // ─── Admin ─────────────────────────────────────────────────────────────

    @Transactional
    public DiyGuideResponse createGuide(DiyGuideRequest request) {
        ensureSparePartExists(request.getSparePartId());
        if (diyGuideRepository.findBySparePartId(request.getSparePartId()).isPresent()) {
            throw new IllegalArgumentException(
                    "A DIY guide already exists for spare part: " + request.getSparePartId());
        }

        DIYGuide guide = new DIYGuide();
        applyRequest(guide, request);
        if (request.getStatus() != null) {
            guide.setStatus(parseStatus(request.getStatus()));
        }
        guide = diyGuideRepository.save(guide);

        List<DiyStepRequest> stepRequests = request.getSteps();
        if (stepRequests != null) {
            for (DiyStepRequest step : stepRequests) {
                saveStep(guide.getId(), step);
            }
        }
        return toResponse(guide);
    }

    @Transactional(readOnly = true)
    public List<DiyGuideResponse> getAllGuides() {
        return diyGuideRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DiyGuideResponse getGuide(Long id) {
        return toResponse(findGuide(id));
    }

    @Transactional
    public DiyGuideResponse updateGuide(Long id, DiyGuideRequest request) {
        DIYGuide guide = findGuide(id);
        if (request.getSparePartId() != null && !request.getSparePartId().equals(guide.getSparePartId())) {
            ensureSparePartExists(request.getSparePartId());
            if (diyGuideRepository.findBySparePartId(request.getSparePartId()).isPresent()) {
                throw new IllegalArgumentException(
                        "A DIY guide already exists for spare part: " + request.getSparePartId());
            }
            guide.setSparePartId(request.getSparePartId());
        }
        applyRequest(guide, request);
        if (request.getStatus() != null) {
            guide.setStatus(parseStatus(request.getStatus()));
        }

        // Replace the whole step list on update (delete + re-add) — simplest
        // and keeps ordering consistent with the submitted payload.
        if (request.getSteps() != null) {
            diyStepRepository.deleteByDiyGuideId(id);
            for (DiyStepRequest step : request.getSteps()) {
                saveStep(id, step);
            }
        }
        diyGuideRepository.save(guide);
        return toResponse(guide);
    }

    @Transactional
    public void deleteGuide(Long id) {
        findGuide(id);
        diyStepRepository.deleteByDiyGuideId(id);
        diyGuideRepository.deleteById(id);
    }

    @Transactional
    public DiyGuideResponse setStatus(Long id, DiyStatus status) {
        DIYGuide guide = findGuide(id);
        guide.setStatus(status);
        diyGuideRepository.save(guide);
        return toResponse(guide);
    }

    // ─── Steps ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DiyStepResponse> getSteps(Long guideId) {
        return diyStepRepository.findByDiyGuideIdOrderByStepNumberAsc(guideId)
                .stream()
                .map(this::toStepResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DiyStepResponse addStep(Long guideId, DiyStepRequest request) {
        findGuide(guideId);
        return toStepResponse(saveStep(guideId, request));
    }

    @Transactional
    public DiyStepResponse updateStep(Long guideId, Long stepId, DiyStepRequest request) {
        findGuide(guideId);
        DIYStep step = diyStepRepository.findById(stepId)
                .filter(s -> s.getDiyGuideId().equals(guideId))
                .orElseThrow(() -> new DiyStepNotFoundException(
                        "Step not found with id: " + stepId + " in guide: " + guideId));
        step.setStepNumber(request.getStepNumber());
        step.setTitle(request.getTitle());
        step.setDescription(request.getDescription());
        step.setImageUrl(request.getImageUrl());
        step.setVideoUrl(request.getVideoUrl());
        return toStepResponse(diyStepRepository.save(step));
    }

    @Transactional
    public void deleteStep(Long guideId, Long stepId) {
        DIYStep step = diyStepRepository.findById(stepId)
                .filter(s -> s.getDiyGuideId().equals(guideId))
                .orElseThrow(() -> new DiyStepNotFoundException(
                        "Step not found with id: " + stepId + " in guide: " + guideId));
        diyStepRepository.delete(step);
    }

    @Transactional
    public DiyStepResponse setStepImage(Long guideId, Long stepId, String imageUrl) {
        findGuide(guideId);
        DIYStep step = diyStepRepository.findById(stepId)
                .filter(s -> s.getDiyGuideId().equals(guideId))
                .orElseThrow(() -> new DiyStepNotFoundException(
                        "Step not found with id: " + stepId + " in guide: " + guideId));
        step.setImageUrl(imageUrl);
        return toStepResponse(diyStepRepository.save(step));
    }

    // ─── Helpers ───────────────────────────────────────────────────────────

    private DIYStep saveStep(Long guideId, DiyStepRequest request) {
        DIYStep step = new DIYStep();
        step.setDiyGuideId(guideId);
        step.setStepNumber(request.getStepNumber());
        step.setTitle(request.getTitle());
        step.setDescription(request.getDescription());
        step.setImageUrl(request.getImageUrl());
        step.setVideoUrl(request.getVideoUrl());
        return diyStepRepository.save(step);
    }

    private void applyRequest(DIYGuide guide, DiyGuideRequest request) {
        guide.setTitle(request.getTitle());
        guide.setDescription(request.getDescription());
        if (request.getDifficultyLevel() != null) {
            guide.setDifficultyLevel(parseDifficulty(request.getDifficultyLevel()));
        }
        if (request.getEstimatedTimeMinutes() > 0) {
            guide.setEstimatedTimeMinutes(request.getEstimatedTimeMinutes());
        }
        if (request.getRequiredTools() != null) {
            guide.setRequiredTools(request.getRequiredTools());
        }
        if (request.getSafetyWarnings() != null) {
            guide.setSafetyWarnings(request.getSafetyWarnings());
        }
        guide.setVideoUrl(request.getVideoUrl());
    }

    private DifficultyLevel parseDifficulty(String value) {
        try {
            return DifficultyLevel.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid difficulty level: " + value + " (expected EASY, MEDIUM or HARD)");
        }
    }

    private DiyStatus parseStatus(String value) {
        try {
            return DiyStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "Invalid status: " + value + " (expected DRAFT or PUBLISHED)");
        }
    }

    private void ensureSparePartExists(Long sparePartId) {
        if (!sparePartRepository.existsById(sparePartId)) {
            throw new SparePartNotFoundException("Spare part not found with id: " + sparePartId);
        }
    }

    private DIYGuide findGuide(Long id) {
        return diyGuideRepository.findById(id)
                .orElseThrow(() -> new DiyGuideNotFoundException("DIY guide not found with id: " + id));
    }

    private DiyGuideResponse toResponse(DIYGuide guide) {
        List<DiyStepResponse> steps = diyStepRepository
                .findByDiyGuideIdOrderByStepNumberAsc(guide.getId())
                .stream()
                .map(this::toStepResponse)
                .collect(Collectors.toList());
        return new DiyGuideResponse(
                guide.getId(),
                guide.getSparePartId(),
                guide.getTitle(),
                guide.getDescription(),
                guide.getDifficultyLevel(),
                guide.getEstimatedTimeMinutes(),
                guide.getRequiredTools(),
                guide.getSafetyWarnings(),
                guide.getVideoUrl(),
                guide.getStatus(),
                steps,
                guide.getCreatedAt(),
                guide.getUpdatedAt()
        );
    }

    private DiyStepResponse toStepResponse(DIYStep step) {
        return new DiyStepResponse(
                step.getId(),
                step.getDiyGuideId(),
                step.getStepNumber(),
                step.getTitle(),
                step.getDescription(),
                step.getImageUrl(),
                step.getVideoUrl()
        );
    }
}
