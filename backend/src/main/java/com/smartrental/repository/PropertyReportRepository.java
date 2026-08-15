package com.smartrental.repository;

import com.smartrental.entity.PropertyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyReportRepository extends JpaRepository<PropertyReport, String> {
    List<PropertyReport> findByStatusOrderByCreatedAtDesc(String status);
}
