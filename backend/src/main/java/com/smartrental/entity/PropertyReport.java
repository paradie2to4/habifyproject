package com.smartrental.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "property_reports")
public class PropertyReport {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "property_id", nullable = false)
    private String propertyId;

    @Column(name = "property_title", nullable = false)
    private String propertyTitle;

    @Column(name = "reporter_id", nullable = false)
    private String reporterId;

    @Column(name = "reporter_name", nullable = false)
    private String reporterName;

    @Column(nullable = false)
    private String reason;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String details;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, INVESTIGATING, RESOLVED, DISMISSED

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public PropertyReport() {}

    public PropertyReport(String id, String propertyId, String propertyTitle, String reporterId, String reporterName, String reason, String details) {
        this.id = id;
        this.propertyId = propertyId;
        this.propertyTitle = propertyTitle;
        this.reporterId = reporterId;
        this.reporterName = reporterName;
        this.reason = reason;
        this.details = details;
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPropertyId() { return propertyId; }
    public void setPropertyId(String propertyId) { this.propertyId = propertyId; }

    public String getPropertyTitle() { return propertyTitle; }
    public void setPropertyTitle(String propertyTitle) { this.propertyTitle = propertyTitle; }

    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }

    public String getReporterName() { return reporterName; }
    public void setReporterName(String reporterName) { this.reporterName = reporterName; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
