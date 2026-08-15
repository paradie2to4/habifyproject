package com.smartrental.controller;

import com.smartrental.entity.ViewingRequest;
import com.smartrental.service.ViewingRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/viewing-requests")
@CrossOrigin(origins = "*")
public class ViewingRequestController {

    @Autowired
    private ViewingRequestService requestService;

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<ViewingRequest>> getTenantRequests(@PathVariable String tenantId) {
        return ResponseEntity.ok(requestService.getRequestsByTenant(tenantId));
    }

    @GetMapping("/landlord/{landlordId}")
    public ResponseEntity<List<ViewingRequest>> getLandlordRequests(@PathVariable String landlordId) {
        return ResponseEntity.ok(requestService.getRequestsByLandlord(landlordId));
    }

    @PostMapping
    public ResponseEntity<ViewingRequest> createRequest(@RequestBody ViewingRequest req) {
        return ResponseEntity.ok(requestService.createViewingRequest(req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ViewingRequest> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusBody
    ) {
        String newStatus = statusBody.get("status");
        return ResponseEntity.ok(requestService.updateStatus(id, newStatus));
    }
}
