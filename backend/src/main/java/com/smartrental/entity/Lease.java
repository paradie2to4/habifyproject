package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Tenancy between a landlord and a tenant for one property. Dates are ISO yyyy-MM-dd. */
@Entity
@Table(name = "leases", indexes = {
        @Index(name = "idx_lease_landlord", columnList = "landlord_id"),
        @Index(name = "idx_lease_tenant", columnList = "tenant_id"),
        @Index(name = "idx_lease_tenant_email", columnList = "tenant_email")
})
@Getter
@Setter
@NoArgsConstructor
public class Lease {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "property_id", nullable = false, length = 50)
    private String propertyId;

    @Column(name = "property_title")
    private String propertyTitle;

    @Column(name = "property_address")
    private String propertyAddress;

    @Column(name = "property_sector")
    private String propertySector;

    @Column(name = "landlord_id", nullable = false, length = 50)
    private String landlordId;

    @Column(name = "landlord_name")
    private String landlordName;

    /** Linked once the tenant has (or creates) a Habify account with this email. */
    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @Column(name = "tenant_name", nullable = false)
    private String tenantName;

    @Column(name = "tenant_phone")
    private String tenantPhone;

    @Column(name = "tenant_email")
    private String tenantEmail;

    @Column(name = "monthly_rent", nullable = false)
    private Double monthlyRent;

    @Column(name = "security_deposit")
    private Double securityDeposit;

    @Column(name = "start_date", nullable = false, length = 10)
    private String startDate;

    @Column(name = "end_date", length = 10)
    private String endDate;

    @Column(name = "payment_due_day")
    private Integer paymentDueDay = 5;

    /** ACTIVE, PENDING_SIGNATURE, EXPIRED, TERMINATED */
    @Column(nullable = false, length = 30)
    private String status = "ACTIVE";

    /** PAID, DUE, OVERDUE — kept current by the daily rent job */
    @Column(name = "payment_status", length = 20)
    private String paymentStatus = "DUE";

    @Column(name = "last_payment_date", length = 10)
    private String lastPaymentDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
