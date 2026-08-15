package com.smartrental.service;

import com.smartrental.entity.TenantPreference;
import com.smartrental.repository.TenantPreferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class TenantPreferenceService {

    @Autowired
    private TenantPreferenceRepository preferenceRepository;

    public Optional<TenantPreference> getPreferenceByUserId(String userId) {
        return preferenceRepository.findByUserId(userId);
    }

    public TenantPreference saveOrUpdatePreference(String userId, TenantPreference pref) {
        Optional<TenantPreference> existing = preferenceRepository.findByUserId(userId);
        if (existing.isPresent()) {
            TenantPreference current = existing.get();
            current.setMaxBudget(pref.getMaxBudget());
            current.setMonthlyIncome(pref.getMonthlyIncome());
            current.setMinBedrooms(pref.getMinBedrooms());
            current.setFurnishedRequired(pref.getFurnishedRequired());
            current.setParkingRequired(pref.getParkingRequired());
            current.setPreferredLocations(pref.getPreferredLocations());
            current.setPreferredPropertyTypes(pref.getPreferredPropertyTypes());
            current.setPreferredAmenities(pref.getPreferredAmenities());
            current.setUpdatedAt(LocalDateTime.now());
            return preferenceRepository.save(current);
        } else {
            pref.setId("pref-" + UUID.randomUUID().toString().substring(0, 8));
            pref.setUserId(userId);
            pref.setUpdatedAt(LocalDateTime.now());
            return preferenceRepository.save(pref);
        }
    }
}
