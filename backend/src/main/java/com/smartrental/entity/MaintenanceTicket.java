package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** A repair request, raised by the tenant (with photos) or logged by the landlord. */
@Entity
@Table(name = "maintenance_tickets", indexes = {
        @Index(name = "idx_maint_landlord", columnList = "landlord_id"),
        @Index(name = "idx_maint_tenant", columnList = "tenant_id")
})
@Getter
@Setter
@NoArgsConstructor
public class MaintenanceTicket {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "property_id", nullable = false, length = 50)
    private String propertyId;

    @Column(name = "property_title")
    private String propertyTitle;

    @Column(name = "property_sector")
    private String propertySector;

    @Column(name = "landlord_id", nullable = false, length = 50)
    private String landlordId;

    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @Column(name = "tenant_name")
    private String tenantName;

    /** TENANT or LANDLORD */
    @Column(name = "reported_by", length = 20)
    private String reportedBy;

    /** PLUMBING, ELECTRICAL_SOLAR, WATER_PUMP_TANK, APPLIANCES, STRUCTURAL_PAINTING, INTERNET_SECURITY */
    @Column(length = 40)
    private String category;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** URGENT, HIGH, MEDIUM, LOW */
    @Column(length = 20)
    private String priority = "MEDIUM";

    @Column(name = "estimated_cost_rwf")
    private Double estimatedCostRwf;

    @Column(name = "actual_cost_rwf")
    private Double actualCostRwf;

    /** REPORTED, IN_PROGRESS, RESOLVED, CANCELLED */
    @Column(nullable = false, length = 20)
    private String status = "REPORTED";

    @Column(name = "contractor_name")
    private String contractorName;

    @Column(name = "landlord_notes", columnDefinition = "TEXT")
    private String landlordNotes;

    /** Comma-separated photo URLs */
    @Column(columnDefinition = "TEXT")
    private String photos;

    @Column(name = "reported_date", length = 10)
    private String reportedDate;

    @Column(name = "resolved_date", length = 10)
    private String resolvedDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
