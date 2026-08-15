package com.smartrental.service;

import com.smartrental.dto.AffordabilityCalculationDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Affordability Service Unit Tests")
class AffordabilityServiceTest {

    private AffordabilityService affordabilityService;

    @BeforeEach
    void setUp() {
        affordabilityService = new AffordabilityService();
    }

    @Test
    @DisplayName("Should classify rent <= 30% of income as COMFORTABLE")
    void testComfortableAffordability() {
        double income = 1000000.0;
        double rent = 250000.0; // 25%

        AffordabilityCalculationDto result = affordabilityService.calculateAffordability(income, rent);

        assertNotNull(result);
        assertEquals("COMFORTABLE", result.getStatus());
        assertTrue(result.isWithinThirtyPercentRule());
        assertEquals(25.0, result.getRentToIncomePercentage());
        assertEquals(300000.0, result.getMaxRecommendedRent());
        assertEquals(750000.0, result.getRemainingDisposableIncome());
        assertFalse(result.getAdvice().isEmpty());
    }

    @Test
    @DisplayName("Should classify rent between 31% and 40% as STRETCHED")
    void testStretchedAffordability() {
        double income = 1000000.0;
        double rent = 350000.0; // 35%

        AffordabilityCalculationDto result = affordabilityService.calculateAffordability(income, rent);

        assertNotNull(result);
        assertEquals("STRETCHED", result.getStatus());
        assertFalse(result.isWithinThirtyPercentRule());
        assertEquals(35.0, result.getRentToIncomePercentage());
        assertEquals(650000.0, result.getRemainingDisposableIncome());
    }

    @Test
    @DisplayName("Should classify rent > 40% as HIGH_RISK")
    void testHighRiskAffordability() {
        double income = 1000000.0;
        double rent = 500000.0; // 50%

        AffordabilityCalculationDto result = affordabilityService.calculateAffordability(income, rent);

        assertNotNull(result);
        assertEquals("HIGH_RISK", result.getStatus());
        assertFalse(result.isWithinThirtyPercentRule());
        assertEquals(50.0, result.getRentToIncomePercentage());
        assertEquals(500000.0, result.getRemainingDisposableIncome());
    }
}
