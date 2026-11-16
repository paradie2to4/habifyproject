package com.smartrental.controller;

import com.smartrental.entity.Inquiry;
import com.smartrental.exception.ApiException;
import com.smartrental.security.AuthUser;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.InquiryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inquiries")
public class InquiryController {

    private final InquiryService inquiryService;

    public InquiryController(InquiryService inquiryService) {
        this.inquiryService = inquiryService;
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<Inquiry>> getTenantInquiries(@PathVariable String tenantId) {
        CurrentUser.requireSelfOrAdmin(tenantId);
        return ResponseEntity.ok(inquiryService.getInquiriesByTenant(tenantId));
    }

    @GetMapping("/landlord/{landlordId}")
    public ResponseEntity<List<Inquiry>> getLandlordInquiries(@PathVariable String landlordId) {
        CurrentUser.requireSelfOrAdmin(landlordId);
        return ResponseEntity.ok(inquiryService.getInquiriesByLandlord(landlordId));
    }

    @PostMapping
    public ResponseEntity<Inquiry> createInquiry(@RequestBody Inquiry inquiry) {
        inquiry.setTenantId(CurrentUser.get().id());
        inquiry.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(inquiryService.createInquiry(inquiry));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Inquiry> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        requireLandlordOf(id);
        return ResponseEntity.ok(inquiryService.updateStatus(id, body.get("status")));
    }

    @PatchMapping("/{id}/reply")
    public ResponseEntity<Inquiry> reply(@PathVariable String id, @RequestBody Map<String, String> body) {
        requireLandlordOf(id);
        String reply = body.get("reply");
        if (reply == null || reply.isBlank()) throw ApiException.badRequest("Reply message is required");
        return ResponseEntity.ok(inquiryService.reply(id, reply.trim()));
    }

    private void requireLandlordOf(String inquiryId) {
        Inquiry inquiry = inquiryService.findById(inquiryId);
        AuthUser user = CurrentUser.get();
        if (!user.canActFor(inquiry.getLandlordId())) throw ApiException.forbidden();
    }
}
