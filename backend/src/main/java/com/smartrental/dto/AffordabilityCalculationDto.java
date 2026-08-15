package com.smartrental.dto;

import java.util.List;

public class AffordabilityCalculationDto {
    private double monthlyIncome;
    private double maxRecommendedRent; // 30% of income
    private double actualMonthlyRent;
    private double rentToIncomePercentage;
    private boolean isWithinThirtyPercentRule;
    private String status; // COMFORTABLE, STRETCHED, HIGH_RISK
    private double remainingDisposableIncome;
    private List<String> advice;

    public AffordabilityCalculationDto() {}

    public double getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(double monthlyIncome) { this.monthlyIncome = monthlyIncome; }

    public double getMaxRecommendedRent() { return maxRecommendedRent; }
    public void setMaxRecommendedRent(double maxRecommendedRent) { this.maxRecommendedRent = maxRecommendedRent; }

    public double getActualMonthlyRent() { return actualMonthlyRent; }
    public void setActualMonthlyRent(double actualMonthlyRent) { this.actualMonthlyRent = actualMonthlyRent; }

    public double getRentToIncomePercentage() { return rentToIncomePercentage; }
    public void setRentToIncomePercentage(double rentToIncomePercentage) { this.rentToIncomePercentage = rentToIncomePercentage; }

    public boolean isWithinThirtyPercentRule() { return isWithinThirtyPercentRule; }
    public void setWithinThirtyPercentRule(boolean withinThirtyPercentRule) { isWithinThirtyPercentRule = withinThirtyPercentRule; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getRemainingDisposableIncome() { return remainingDisposableIncome; }
    public void setRemainingDisposableIncome(double remainingDisposableIncome) { this.remainingDisposableIncome = remainingDisposableIncome; }

    public List<String> getAdvice() { return advice; }
    public void setAdvice(List<String> advice) { this.advice = advice; }
}
