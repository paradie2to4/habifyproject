package com.smartrental.controller;

import com.smartrental.entity.Inquiry;
import com.smartrental.service.InquiryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inquiries")
@CrossOrigin(origins = "*")
public class InquiryController {

    @Autowired
    private InquiryService inquiryService;

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<Inquiry>> getTenantInquiries(@PathVariable String tenantId) {
        return ResponseEntity.ok(inquiryService.getInquiriesByTenant(tenantId));
    }

    @GetMapping("/landlord/{landlordId}")
    public ResponseEntity<List<Inquiry>> getLandlordInquiries(@PathVariable String landlordId) {
        return ResponseEntity.ok(inquiryService.getInquiriesByLandlord(landlordId));
    }

    @PostMapping
    public ResponseEntity<Inquiry> createInquiry(@RequestBody Inquiry inquiry) {
        return ResponseEntity.ok(inquiryService.createInquiry(inquiry));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Inquiry> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> statusBody
    ) {
        String newStatus = statusBody.get("status");
        return ResponseEntity.ok(inquiryService.updateStatus(id, newStatus));
    }
}
