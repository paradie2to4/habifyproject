package com.smartrental.dto;

import java.util.List;

public class MatchExplanationDto {
    private int overallScore; // 0 - 100
    private int budgetScore; // max 30
    private int locationScore; // max 25
    private int typeScore; // max 15
    private int bedroomsScore; // max 10
    private int furnishedScore; // max 10
    private int amenitiesScore; // max 10
    private boolean isAffordable;
    private double rentToIncomeRatio; // percentage
    private List<String> matchHighlights;
    private List<String> tradeOffs;

    public MatchExplanationDto() {}

    public int getOverallScore() { return overallScore; }
    public void setOverallScore(int overallScore) { this.overallScore = overallScore; }

    public int getBudgetScore() { return budgetScore; }
    public void setBudgetScore(int budgetScore) { this.budgetScore = budgetScore; }

    public int getLocationScore() { return locationScore; }
    public void setLocationScore(int locationScore) { this.locationScore = locationScore; }

    public int getTypeScore() { return typeScore; }
    public void setTypeScore(int typeScore) { this.typeScore = typeScore; }

    public int getBedroomsScore() { return bedroomsScore; }
    public void setBedroomsScore(int bedroomsScore) { this.bedroomsScore = bedroomsScore; }

    public int getFurnishedScore() { return furnishedScore; }
    public void setFurnishedScore(int furnishedScore) { this.furnishedScore = furnishedScore; }

    public int getAmenitiesScore() { return amenitiesScore; }
    public void setAmenitiesScore(int amenitiesScore) { this.amenitiesScore = amenitiesScore; }

    public boolean isAffordable() { return isAffordable; }
    public void setAffordable(boolean affordable) { isAffordable = affordable; }

    public double getRentToIncomeRatio() { return rentToIncomeRatio; }
    public void setRentToIncomeRatio(double rentToIncomeRatio) { this.rentToIncomeRatio = rentToIncomeRatio; }

    public List<String> getMatchHighlights() { return matchHighlights; }
    public void setMatchHighlights(List<String> matchHighlights) { this.matchHighlights = matchHighlights; }

    public List<String> getTradeOffs() { return tradeOffs; }
    public void setTradeOffs(List<String> tradeOffs) { this.tradeOffs = tradeOffs; }
}
