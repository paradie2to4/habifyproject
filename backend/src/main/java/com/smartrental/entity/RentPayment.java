package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** A rent payment with its receipt. Recorded by the landlord (VERIFIED) or reported by the tenant (PENDING). */
@Entity
@Table(name = "rent_payments", indexes = {
        @Index(name = "idx_pay_lease", columnList = "lease_id"),
        @Index(name = "idx_pay_landlord", columnList = "landlord_id")
})
@Getter
@Setter
@NoArgsConstructor
public class RentPayment {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "receipt_number", nullable = false, unique = true, length = 40)
    private String receiptNumber;

    @Column(name = "lease_id", nullable = false, length = 50)
    private String leaseId;

    @Column(name = "property_id", length = 50)
    private String propertyId;

    @Column(name = "property_title")
    private String propertyTitle;

    @Column(name = "landlord_id", nullable = false, length = 50)
    private String landlordId;

    @Column(name = "landlord_name")
    private String landlordName;

    @Column(name = "tenant_id", length = 50)
    private String tenantId;

    @Column(name = "tenant_name")
    private String tenantName;

    @Column(name = "amount_rwf", nullable = false)
    private Double amountRwf;

    /** MTN_MOMO, AIRTEL_MONEY, BK_TRANSFER, IM_BANK, CASH */
    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "transaction_reference", length = 80)
    private String transactionReference;

    /** Human label such as "November 2026" */
    @Column(name = "paid_for_month", length = 40)
    private String paidForMonth;

    /** Period key yyyy-MM used for rent-due checks */
    @Column(name = "period", length = 7)
    private String period;

    @Column(name = "payment_date", length = 10)
    private String paymentDate;

    /** VERIFIED or PENDING (reported by the tenant, waiting for the landlord) */
    @Column(nullable = false, length = 20)
    private String status = "VERIFIED";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
