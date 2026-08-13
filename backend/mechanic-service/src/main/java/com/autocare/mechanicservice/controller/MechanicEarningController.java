package com.autocare.mechanicservice.controller;

import com.autocare.mechanicservice.dto.EarningsSummaryResponse;
import com.autocare.mechanicservice.dto.MechanicResponse;
import com.autocare.mechanicservice.service.MechanicEarningService;
import com.autocare.mechanicservice.service.MechanicService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Mechanic earnings. The mechanic profile is resolved from the JWT subject —
 * never from a request body.
 */
@RestController
@RequestMapping("/api/mechanics")
public class MechanicEarningController {

    private final MechanicEarningService earningService;
    private final MechanicService mechanicService;

    public MechanicEarningController(MechanicEarningService earningService,
                                     MechanicService mechanicService) {
        this.earningService = earningService;
        this.mechanicService = mechanicService;
    }

    @GetMapping("/earnings")
    public ResponseEntity<EarningsSummaryResponse> myEarnings(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        MechanicResponse profile = mechanicService.getMechanicByUserId(userId);
        return ResponseEntity.ok(earningService.getEarningsSummary(profile.getId()));
    }
}
