package com.smartrental.repository;

import com.smartrental.entity.SavedSearch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedSearchRepository extends JpaRepository<SavedSearch, String> {
    List<SavedSearch> findByUserIdOrderByCreatedAtDesc(String userId);

    List<SavedSearch> findByAlertsEnabledTrue();

    long countByUserId(String userId);
}
