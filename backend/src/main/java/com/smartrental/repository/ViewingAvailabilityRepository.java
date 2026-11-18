package com.smartrental.repository;

import com.smartrental.entity.ViewingAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ViewingAvailabilityRepository extends JpaRepository<ViewingAvailability, String> {
    List<ViewingAvailability> findByLandlordIdOrderByDayOfWeekAscStartTimeAsc(String landlordId);

    void deleteByLandlordId(String landlordId);
}
