package com.smartrental.repository;

import com.smartrental.entity.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, String> {
    List<Inquiry> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<Inquiry> findByLandlordIdOrderByCreatedAtDesc(String landlordId);
    List<Inquiry> findByPropertyId(String propertyId);
}
