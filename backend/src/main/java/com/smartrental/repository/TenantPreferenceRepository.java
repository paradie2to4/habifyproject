package com.smartrental.repository;

import com.smartrental.entity.TenantPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TenantPreferenceRepository extends JpaRepository<TenantPreference, String> {
    Optional<TenantPreference> findByUserId(String userId);
}
