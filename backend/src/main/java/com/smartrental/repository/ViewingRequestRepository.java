package com.smartrental.repository;

import com.smartrental.entity.ViewingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ViewingRequestRepository extends JpaRepository<ViewingRequest, String> {
    List<ViewingRequest> findByTenantIdOrderByCreatedAtDesc(String tenantId);
    List<ViewingRequest> findByLandlordIdOrderByCreatedAtDesc(String landlordId);
    List<ViewingRequest> findByPropertyId(String propertyId);
}
