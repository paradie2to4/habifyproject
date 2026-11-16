package com.smartrental.controller;

import com.smartrental.entity.TenantPreference;
import com.smartrental.service.TenantPreferenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import com.smartrental.security.CurrentUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/preferences")
public class TenantPreferenceController {

    @Autowired
    private TenantPreferenceService preferenceService;

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<TenantPreference> getPreference(@PathVariable String tenantId) {
        CurrentUser.requireSelfOrAdmin(tenantId);
        return preferenceService.getPreferenceByUserId(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/tenant/{tenantId}")
    public ResponseEntity<TenantPreference> savePreference(
            @PathVariable String tenantId,
            @RequestBody TenantPreference preference
    ) {
        CurrentUser.requireSelfOrAdmin(tenantId);
        return ResponseEntity.ok(preferenceService.saveOrUpdatePreference(tenantId, preference));
    }
}
