package com.smartrental.controller;

import com.smartrental.entity.ViewingRequest;
import com.smartrental.exception.ApiException;
import com.smartrental.security.AuthUser;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.ViewingRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/viewing-requests")
public class ViewingRequestController {

    private final ViewingRequestService requestService;

    public ViewingRequestController(ViewingRequestService requestService) {
        this.requestService = requestService;
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<ViewingRequest>> getTenantRequests(@PathVariable String tenantId) {
        CurrentUser.requireSelfOrAdmin(tenantId);
        return ResponseEntity.ok(requestService.getRequestsByTenant(tenantId));
    }

    @GetMapping("/landlord/{landlordId}")
    public ResponseEntity<List<ViewingRequest>> getLandlordRequests(@PathVariable String landlordId) {
        CurrentUser.requireSelfOrAdmin(landlordId);
        return ResponseEntity.ok(requestService.getRequestsByLandlord(landlordId));
    }

    @PostMapping
    public ResponseEntity<ViewingRequest> createRequest(@RequestBody ViewingRequest req) {
        req.setTenantId(CurrentUser.get().id());
        req.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(requestService.createViewingRequest(req));
    }

    /** Landlord can set any status; the tenant who booked may only cancel. */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ViewingRequest> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        ViewingRequest existing = requestService.findById(id);
        AuthUser user = CurrentUser.get();
        String status = ViewingRequestService.normalizeStatus(body.get("status"));
        boolean isLandlord = user.canActFor(existing.getLandlordId());
        boolean isTenantCancelling = user.id().equals(existing.getTenantId()) && "CANCELLED".equals(status);
        if (!isLandlord && !isTenantCancelling) throw ApiException.forbidden();
        return ResponseEntity.ok(requestService.updateStatus(id, status, isLandlord ? body.get("landlordNote") : null));
    }
}
