package com.smartrental.repository;

import com.smartrental.entity.RentPayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface RentPaymentRepository extends JpaRepository<RentPayment, String> {
    List<RentPayment> findByLandlordIdOrderByCreatedAtDesc(String landlordId);

    List<RentPayment> findByLeaseIdInOrderByCreatedAtDesc(Collection<String> leaseIds);

    boolean existsByLeaseIdAndPeriodAndStatus(String leaseId, String period, String status);
}
