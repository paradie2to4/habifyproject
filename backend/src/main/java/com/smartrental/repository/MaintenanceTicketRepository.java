package com.smartrental.repository;

import com.smartrental.entity.MaintenanceTicket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicket, String> {
    List<MaintenanceTicket> findByLandlordIdOrderByCreatedAtDesc(String landlordId);

    List<MaintenanceTicket> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
