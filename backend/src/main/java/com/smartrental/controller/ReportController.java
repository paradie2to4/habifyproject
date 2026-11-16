package com.smartrental.controller;

import com.smartrental.entity.PropertyReport;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.PropertyReportRepository;
import com.smartrental.security.CurrentUser;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

/** Any signed-in user can flag a listing; admins moderate via /api/admin/reports. */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final PropertyReportRepository reportRepository;

    public ReportController(PropertyReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @PostMapping
    public ResponseEntity<PropertyReport> create(@RequestBody PropertyReport report) {
        if (report.getPropertyId() == null || report.getReason() == null) {
            throw ApiException.badRequest("propertyId and reason are required");
        }
        report.setId("rep-" + UUID.randomUUID().toString().substring(0, 8));
        report.setReporterId(CurrentUser.get().id());
        report.setStatus("PENDING");
        report.setAdminNotes(null);
        report.setCreatedAt(LocalDateTime.now());
        if (report.getDetails() == null) report.setDetails("");
        return ResponseEntity.status(HttpStatus.CREATED).body(reportRepository.save(report));
    }
}
