package com.smartrental.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_preferences")
public class TenantPreference {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "max_budget", nullable = false)
    private Double maxBudget;

    @Column(name = "monthly_income", nullable = false)
    private Double monthlyIncome;

    @Column(name = "min_bedrooms", nullable = false)
    private Integer minBedrooms = 1;

    @Column(name = "furnished_required")
    private Boolean furnishedRequired = false;

    @Column(name = "parking_required")
    private Boolean parkingRequired = false;

    @Column(name = "preferred_locations", columnDefinition = "TEXT")
    private String preferredLocations; // Comma-delimited

    @Column(name = "preferred_property_types", columnDefinition = "TEXT")
    private String preferredPropertyTypes; // Comma-delimited

    @Column(name = "preferred_amenities", columnDefinition = "TEXT")
    private String preferredAmenities; // Comma-delimited

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public TenantPreference() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Double getMaxBudget() { return maxBudget; }
    public void setMaxBudget(Double maxBudget) { this.maxBudget = maxBudget; }

    public Double getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(Double monthlyIncome) { this.monthlyIncome = monthlyIncome; }

    public Integer getMinBedrooms() { return minBedrooms; }
    public void setMinBedrooms(Integer minBedrooms) { this.minBedrooms = minBedrooms; }

    public Boolean getFurnishedRequired() { return furnishedRequired; }
    public void setFurnishedRequired(Boolean furnishedRequired) { this.furnishedRequired = furnishedRequired; }

    public Boolean getParkingRequired() { return parkingRequired; }
    public void setParkingRequired(Boolean parkingRequired) { this.parkingRequired = parkingRequired; }

    public String getPreferredLocations() { return preferredLocations; }
    public void setPreferredLocations(String preferredLocations) { this.preferredLocations = preferredLocations; }

    public String getPreferredPropertyTypes() { return preferredPropertyTypes; }
    public void setPreferredPropertyTypes(String preferredPropertyTypes) { this.preferredPropertyTypes = preferredPropertyTypes; }

    public String getPreferredAmenities() { return preferredAmenities; }
    public void setPreferredAmenities(String preferredAmenities) { this.preferredAmenities = preferredAmenities; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
