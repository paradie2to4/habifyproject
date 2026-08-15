package com.smartrental.service;

import com.smartrental.dto.MatchExplanationDto;
import com.smartrental.dto.PropertyRecommendationDto;
import com.smartrental.entity.Property;
import com.smartrental.entity.TenantPreference;
import com.smartrental.repository.PropertyRepository;
import com.smartrental.repository.TenantPreferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class SmartMatchingService {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private TenantPreferenceRepository preferenceRepository;

    /**
     * Calculates the multidimensional weighted match score between a tenant preference and a property.
     * Weights:
     * - Budget Score: 30 pts
     * - Location Match: 25 pts
     * - Property Type Match: 15 pts
     * - Bedroom Compliance: 10 pts
     * - Furnishing Requirement: 10 pts
     * - Amenities Overlap: 10 pts
     * Total: 100 pts
     */
    public MatchExplanationDto evaluateMatch(TenantPreference pref, Property prop) {
        MatchExplanationDto explanation = new MatchExplanationDto();
        List<String> highlights = new ArrayList<>();
        List<String> tradeOffs = new ArrayList<>();

        // 1. Budget Score (Max 30)
        int budgetScore = 0;
        if (prop.getMonthlyRent() <= pref.getMaxBudget()) {
            budgetScore = 30;
            double savings = pref.getMaxBudget() - prop.getMonthlyRent();
            if (savings > 0) {
                highlights.add(String.format("RWF %,.0f under your maximum budget", savings));
            } else {
                highlights.add("Fits exactly within your designated budget");
            }
        } else {
            double excess = prop.getMonthlyRent() - pref.getMaxBudget();
            double excessRatio = excess / pref.getMaxBudget();
            if (excessRatio <= 0.10) {
                budgetScore = 20;
                tradeOffs.add(String.format("Exceeds budget by RWF %,.0f (+%.0f%%)", excess, excessRatio * 100));
            } else if (excessRatio <= 0.25) {
                budgetScore = 10;
                tradeOffs.add(String.format("Moderately over budget (+%.0f%%)", excessRatio * 100));
            } else {
                budgetScore = 0;
                tradeOffs.add(String.format("Significantly exceeds budget (+%.0f%%)", excessRatio * 100));
            }
        }

        // 2. Location Score (Max 25)
        int locationScore = 0;
        List<String> preferredLocs = parseCommaSeparated(pref.getPreferredLocations());
        if (preferredLocs.isEmpty()) {
            locationScore = 25; // Neutral/No preference
        } else if (containsIgnoreCase(preferredLocs, prop.getLocationSector())) {
            locationScore = 25;
            highlights.add(String.format("Located in your preferred Kigali sector (%s)", prop.getLocationSector()));
        } else {
            locationScore = 5;
            tradeOffs.add(String.format("Located in %s instead of preferred areas", prop.getLocationSector()));
        }

        // 3. Property Type Score (Max 15)
        int typeScore = 0;
        List<String> preferredTypes = parseCommaSeparated(pref.getPreferredPropertyTypes());
        if (preferredTypes.isEmpty() || containsIgnoreCase(preferredTypes, prop.getPropertyType())) {
            typeScore = 15;
            highlights.add(String.format("Matches preferred property type (%s)", prop.getPropertyType()));
        } else {
            typeScore = 4;
            tradeOffs.add(String.format("Is a %s rather than requested types", prop.getPropertyType()));
        }

        // 4. Bedroom Count Score (Max 10)
        int bedroomScore = 0;
        if (prop.getBedrooms() >= pref.getMinBedrooms()) {
            bedroomScore = 10;
            if (prop.getBedrooms() > pref.getMinBedrooms()) {
                highlights.add(String.format("Offers %d bedrooms (exceeds your %d-bed minimum)", prop.getBedrooms(), pref.getMinBedrooms()));
            } else {
                highlights.add(String.format("Has required %d bedrooms", prop.getBedrooms()));
            }
        } else {
            bedroomScore = 3;
            tradeOffs.add(String.format("Only has %d bedroom(s), you requested minimum %d", prop.getBedrooms(), pref.getMinBedrooms()));
        }

        // 5. Furnishing Score (Max 10)
        int furnishedScore = 0;
        if (!Boolean.TRUE.equals(pref.getFurnishedRequired())) {
            furnishedScore = 10;
        } else if (Boolean.TRUE.equals(prop.getIsFurnished())) {
            furnishedScore = 10;
            highlights.add("Fully furnished as requested");
        } else {
            furnishedScore = 0;
            tradeOffs.add("Unfurnished (you preferred furnished)");
        }

        // 6. Amenities Overlap Score (Max 10)
        int amenitiesScore = 0;
        List<String> preferredAmenities = parseCommaSeparated(pref.getPreferredAmenities());
        List<String> propAmenities = parseCommaSeparated(prop.getAmenities());

        if (preferredAmenities.isEmpty()) {
            amenitiesScore = 10;
        } else {
            long matches = preferredAmenities.stream()
                    .filter(a -> containsIgnoreCase(propAmenities, a))
                    .count();
            double matchRatio = (double) matches / preferredAmenities.size();
            amenitiesScore = (int) Math.round(matchRatio * 10);
            if (matches > 0) {
                highlights.add(String.format("Includes %d of your preferred amenities", matches));
            }
            if (matches < preferredAmenities.size()) {
                List<String> missing = preferredAmenities.stream()
                        .filter(a -> !containsIgnoreCase(propAmenities, a))
                        .collect(Collectors.toList());
                tradeOffs.add("Missing requested: " + String.join(", ", missing));
            }
        }

        // Affordability ratio (30% rule calculation)
        double monthlyIncome = pref.getMonthlyIncome() != null && pref.getMonthlyIncome() > 0 ? pref.getMonthlyIncome() : 1;
        double rentToIncomeRatio = (prop.getMonthlyRent() / monthlyIncome) * 100;
        boolean isAffordable = rentToIncomeRatio <= 30.0;

        if (isAffordable) {
            highlights.add(String.format("Passed 30%% affordability rule (Rent is %.1f%% of monthly income)", rentToIncomeRatio));
        } else {
            tradeOffs.add(String.format("Rent takes %.1f%% of monthly income (exceeds recommended 30%% ceiling)", rentToIncomeRatio));
        }

        int overallScore = budgetScore + locationScore + typeScore + bedroomScore + furnishedScore + amenitiesScore;

        explanation.setOverallScore(overallScore);
        explanation.setBudgetScore(budgetScore);
        explanation.setLocationScore(locationScore);
        explanation.setTypeScore(typeScore);
        explanation.setBedroomsScore(bedroomScore);
        explanation.setFurnishedScore(furnishedScore);
        explanation.setAmenitiesScore(amenitiesScore);
        explanation.setAffordable(isAffordable);
        explanation.setRentToIncomeRatio(Math.round(rentToIncomeRatio * 10.0) / 10.0);
        explanation.setMatchHighlights(highlights);
        explanation.setTradeOffs(tradeOffs);

        return explanation;
    }

    public List<PropertyRecommendationDto> getRecommendationsForTenant(String tenantUserId) {
        TenantPreference pref = preferenceRepository.findByUserId(tenantUserId)
                .orElseGet(this::createDefaultPreference);

        List<Property> availableProperties = propertyRepository.findByIsAvailableTrue();

        return availableProperties.stream()
                .map(p -> new PropertyRecommendationDto(p, evaluateMatch(pref, p)))
                .sorted(Comparator.comparingInt((PropertyRecommendationDto dto) -> dto.getMatchExplanation().getOverallScore()).reversed())
                .collect(Collectors.toList());
    }

    private TenantPreference createDefaultPreference() {
        TenantPreference def = new TenantPreference();
        def.setMaxBudget(500000.0);
        def.setMonthlyIncome(1500000.0);
        def.setMinBedrooms(2);
        def.setFurnishedRequired(true);
        def.setPreferredLocations("Kimihurura,Kacyiru,Remera,Kiyovu");
        def.setPreferredPropertyTypes("APARTMENT,HOUSE");
        def.setPreferredAmenities("High-speed WiFi,Water Tank & Pump,24/7 Security Guard");
        return def;
    }

    private List<String> parseCommaSeparated(String text) {
        if (text == null || text.trim().isEmpty()) return Collections.emptyList();
        return Arrays.stream(text.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private boolean containsIgnoreCase(List<String> list, String target) {
        if (target == null) return false;
        return list.stream().anyMatch(item -> item.equalsIgnoreCase(target.trim()));
    }
}
