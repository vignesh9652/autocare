package com.autocare.sparepartsservice.controller;

import com.autocare.sparepartsservice.dto.DiyGuideResponse;
import com.autocare.sparepartsservice.dto.DiyStepResponse;
import com.autocare.sparepartsservice.service.DiyGuideService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Customer-facing DIY guide endpoints. Only {@code PUBLISHED} guides are
 * exposed. Reads are public (matching the GET /api/parts convention) so the
 * guide is reachable without logging in.
 */
@RestController
@RequestMapping("/api/parts")
public class DiyGuideController {

    private final DiyGuideService diyGuideService;

    public DiyGuideController(DiyGuideService diyGuideService) {
        this.diyGuideService = diyGuideService;
    }

    /** Published DIY guide for a spare part (404 when none is published). */
    @GetMapping("/{sparePartId}/diy")
    public ResponseEntity<DiyGuideResponse> getGuide(@PathVariable Long sparePartId) {
        return ResponseEntity.ok(diyGuideService.getPublishedGuideForPart(sparePartId));
    }

    /** Ordered installation steps of the published guide. */
    @GetMapping("/{sparePartId}/diy/steps")
    public ResponseEntity<List<DiyStepResponse>> getSteps(@PathVariable Long sparePartId) {
        return ResponseEntity.ok(diyGuideService.getPublishedStepsForPart(sparePartId));
    }
}
