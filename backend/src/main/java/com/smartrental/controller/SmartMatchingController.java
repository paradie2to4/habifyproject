package com.smartrental.controller;

import com.smartrental.dto.MatchExplanationDto;
import com.smartrental.dto.PropertyRecommendationDto;
import com.smartrental.entity.Property;
import com.smartrental.entity.TenantPreference;
import com.smartrental.service.PropertyService;
import com.smartrental.service.SmartMatchingService;
import com.smartrental.service.TenantPreferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
public class SmartMatchingController {

    @Autowired
    private SmartMatchingService matchingService;

    @Autowired
    private TenantPreferenceService preferenceService;

    @Autowired
    private PropertyService propertyService;

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<PropertyRecommendationDto>> getTenantRecommendations(@PathVariable String tenantId) {
        return ResponseEntity.ok(matchingService.getRecommendationsForTenant(tenantId));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<MatchExplanationDto> evaluateCustom(
            @RequestParam String propertyId,
            @RequestBody TenantPreference preference
    ) {
        return propertyService.getPropertyById(propertyId)
                .map(p -> ResponseEntity.ok(matchingService.evaluateMatch(preference, p)))
                .orElse(ResponseEntity.notFound().build());
    }
}
