package com.smartrental.service;

import com.smartrental.dto.AffordabilityCalculationDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AffordabilityService {

    /**
     * Standard 30% Gross Income Affordability Rule Calculator
     * Rent <= 30% of income = Comfortable
     * Rent 31% - 40% = Stretched
     * Rent > 40% = High Risk of rent burden
     */
    public AffordabilityCalculationDto calculateAffordability(double monthlyIncome, double targetRent) {
        AffordabilityCalculationDto dto = new AffordabilityCalculationDto();
        List<String> advice = new ArrayList<>();

        double maxRecommended = monthlyIncome * 0.30;
        double ratio = (targetRent / monthlyIncome) * 100.0;
        double remaining = monthlyIncome - targetRent;

        dto.setMonthlyIncome(monthlyIncome);
        dto.setMaxRecommendedRent(maxRecommended);
        dto.setActualMonthlyRent(targetRent);
        dto.setRentToIncomePercentage(Math.round(ratio * 10.0) / 10.0);
        dto.setWithinThirtyPercentRule(ratio <= 30.0);
        dto.setRemainingDisposableIncome(remaining);

        if (ratio <= 30.0) {
            dto.setStatus("COMFORTABLE");
            advice.add("Financially sound: Leaves 70%+ of your income for utilities, groceries, and savings.");
            advice.add("Landlords typically approve applications with rent-to-income under 30% with minimal deposit friction.");
        } else if (ratio <= 40.0) {
            dto.setStatus("STRETCHED");
            advice.add("Manageable but tight: Monthly living expenses and transport must be monitored closely.");
            advice.add("Consider splitting with a roommate or negotiating utilities inclusion.");
        } else {
            dto.setStatus("HIGH_RISK");
            advice.add("Rent burdened: More than 40% of income spent on shelter creates financial vulnerability.");
            advice.add("Recommended to look for options under RWF " + String.format("%,.0f", maxRecommended) + "/month.");
        }

        dto.setAdvice(advice);
        return dto;
    }
}
