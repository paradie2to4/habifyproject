package com.smartrental.service;

import com.smartrental.dto.MatchExplanationDto;
import com.smartrental.entity.Property;
import com.smartrental.entity.TenantPreference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Smart Matching Engine Algorithm Unit Tests")
class SmartMatchingServiceTest {

    private SmartMatchingService matchingService;

    @BeforeEach
    void setUp() {
        matchingService = new SmartMatchingService();
    }

    private TenantPreference createIdealPreference() {
        TenantPreference pref = new TenantPreference();
        pref.setMaxBudget(800000.0);
        pref.setPreferredLocations("Kimihurura, Nyarutarama, Kacyiru");
        pref.setPreferredPropertyTypes("APARTMENT, VILLA");
        pref.setMinBedrooms(2);
        pref.setFurnishedRequired(true);
        pref.setPreferredAmenities("High-Speed Fiber Internet, Water Storage Tank, Backup Generator, 24/7 Security Guard, Solar Water Heating");
        pref.setMonthlyIncome(2500000.0);
        return pref;
    }

    private Property createMatchingProperty() {
        Property prop = new Property();
        prop.setId("prop-kigali-01");
        prop.setTitle("Kimihurura Executive 2BR Apartment");
        prop.setLocationSector("Kimihurura");
        prop.setPropertyType("APARTMENT");
        prop.setMonthlyRent(750000.0);
        prop.setBedrooms(2);
        prop.setBathrooms(2);
        prop.setIsFurnished(true);
        prop.setHasParking(true);
        prop.setAmenities("High-Speed Fiber Internet, Water Storage Tank, Backup Generator, 24/7 Security Guard, Solar Water Heating");
        return prop;
    }

    @Test
    @DisplayName("Should award 100/100 for a perfectly matching property")
    void testPerfectPropertyMatch() {
        TenantPreference pref = createIdealPreference();
        Property prop = createMatchingProperty();

        MatchExplanationDto result = matchingService.evaluateMatch(pref, prop);

        assertNotNull(result);
        assertEquals(100, result.getOverallScore(), "Perfect match should score 100 points");
        assertEquals(30, result.getBudgetScore(), "Under budget should earn full 30 budget points");
        assertEquals(25, result.getLocationScore(), "Kimihurura is in preferred sectors (25 points)");
        assertEquals(15, result.getTypeScore(), "APARTMENT is preferred (15 points)");
        assertEquals(10, result.getBedroomsScore(), "2 bedrooms equals min requirement (10 points)");
        assertEquals(10, result.getFurnishedScore(), "Fully furnished satisfies requirement (10 points)");
        assertEquals(10, result.getAmenitiesScore(), "5/5 amenities overlap yields full 10 points");
        assertTrue(result.isAffordable(), "750k RWF on 2.5M income is 30% or under (Affordable)");
        assertTrue(result.getMatchHighlights().size() >= 4, "Should provide descriptive highlight reasons");
    }

    @Test
    @DisplayName("Should apply linear budget penalty when property exceeds maximum budget")
    void testBudgetPenaltyCalculation() {
        TenantPreference pref = createIdealPreference(); // max budget 800k
        Property prop = createMatchingProperty();

        // 1. Slightly over budget (<= 10% excess -> 850k on 800k max)
        prop.setMonthlyRent(850000.0);
        MatchExplanationDto result10 = matchingService.evaluateMatch(pref, prop);
        assertEquals(20, result10.getBudgetScore(), "Excess <= 10% should receive partial 20 pts");

        // 2. Moderately over budget (10% to 25% excess -> 950k on 800k max)
        prop.setMonthlyRent(950000.0);
        MatchExplanationDto result25 = matchingService.evaluateMatch(pref, prop);
        assertEquals(10, result25.getBudgetScore(), "Excess <= 25% should receive 10 pts");

        // 3. Severely over budget (> 25% excess -> 1,200,000 RWF on 800k max)
        prop.setMonthlyRent(1200000.0);
        MatchExplanationDto resultExcess = matchingService.evaluateMatch(pref, prop);
        assertEquals(0, resultExcess.getBudgetScore(), "Excess > 25% receives 0 budget points");
    }

    @Test
    @DisplayName("Should score location mismatch with partial base points and descriptive trade-off")
    void testLocationMismatch() {
        TenantPreference pref = createIdealPreference(); // Preferred: Kimihurura, Nyarutarama, Kacyiru
        Property prop = createMatchingProperty();
        prop.setLocationSector("Kanombe"); // Outside preferred sectors

        MatchExplanationDto result = matchingService.evaluateMatch(pref, prop);

        assertEquals(5, result.getLocationScore(), "Location outside preferences receives baseline 5 points");
        assertTrue(result.getTradeOffs().stream().anyMatch(t -> t.contains("Kanombe")), 
            "Trade-off list must mention the non-matching sector");
    }

    @Test
    @DisplayName("Should penalize unfurnished property when tenant explicitly requires furnished")
    void testFurnishingMismatch() {
        TenantPreference pref = createIdealPreference();
        pref.setFurnishedRequired(true);

        Property prop = createMatchingProperty();
        prop.setIsFurnished(false);

        MatchExplanationDto result = matchingService.evaluateMatch(pref, prop);

        assertEquals(0, result.getFurnishedScore(), "Unfurnished property scores 0 for furnished requirement");
        assertTrue(result.getTradeOffs().stream().anyMatch(t -> t.toLowerCase().contains("unfurnished")));
    }

    @Test
    @DisplayName("Should accurately compute proportional amenities overlap score")
    void testAmenitiesOverlapCalculation() {
        TenantPreference pref = createIdealPreference();
        // Tenant wants 5 amenities
        pref.setPreferredAmenities("Fiber Internet, Water Tank, Solar Water Heating, Backup Generator, Swimming Pool");

        Property prop = createMatchingProperty();
        // Property provides 3 of those 5 amenities (60% overlap -> 6 points)
        prop.setAmenities("Fiber Internet, Water Tank, Solar Water Heating");

        MatchExplanationDto result = matchingService.evaluateMatch(pref, prop);

        assertEquals(6, result.getAmenitiesScore(), "3 of 5 amenities matched should yield 6 points (60%)");
        assertTrue(result.getMatchHighlights().stream().anyMatch(h -> h.contains("3 of your preferred amenities")));
        assertTrue(result.getTradeOffs().stream().anyMatch(t -> t.contains("Backup Generator") && t.contains("Swimming Pool")));
    }

    @Test
    @DisplayName("Should verify 30% gross income affordability check correctly")
    void testIncomeAffordabilityRule() {
        TenantPreference pref = createIdealPreference();
        pref.setMonthlyIncome(1000000.0); // 1,000,000 RWF gross

        Property prop = createMatchingProperty();
        prop.setMonthlyRent(280000.0); // 28% of income -> within 30% rule

        MatchExplanationDto safeResult = matchingService.evaluateMatch(pref, prop);
        assertTrue(safeResult.isAffordable());
        assertEquals(28.0, safeResult.getRentToIncomeRatio());

        prop.setMonthlyRent(450000.0); // 45% of income -> exceeds 30% rule
        MatchExplanationDto burdendResult = matchingService.evaluateMatch(pref, prop);
        assertFalse(burdendResult.isAffordable());
        assertEquals(45.0, burdendResult.getRentToIncomeRatio());
    }
}
