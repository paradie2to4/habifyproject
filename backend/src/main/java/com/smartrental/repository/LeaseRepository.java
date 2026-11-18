package com.smartrental.repository;

import com.smartrental.entity.Lease;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaseRepository extends JpaRepository<Lease, String> {
    List<Lease> findByLandlordIdOrderByCreatedAtDesc(String landlordId);

    List<Lease> findByTenantIdOrderByCreatedAtDesc(String tenantId);

    /** Leases created for an email before that person had an account. */
    List<Lease> findByTenantIdIsNullAndTenantEmailIgnoreCase(String tenantEmail);

    List<Lease> findByStatus(String status);
}
