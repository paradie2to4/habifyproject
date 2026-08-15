package com.smartrental.dto;

import java.util.ArrayList;
import java.util.List;

public class ListingQualityDto {
    private String propertyId;
    private int qualityScore;
    private String ratingLabel; // EXCELLENT, GOOD, FAIR, NEEDS_IMPROVEMENT
    private List<String> recommendations = new ArrayList<>();
    private List<String> strongPoints = new ArrayList<>();

    public ListingQualityDto() {}

    public String getPropertyId() { return propertyId; }
    public void setPropertyId(String propertyId) { this.propertyId = propertyId; }

    public int getQualityScore() { return qualityScore; }
    public void setQualityScore(int qualityScore) { this.qualityScore = qualityScore; }

    public String getRatingLabel() { return ratingLabel; }
    public void setRatingLabel(String ratingLabel) { this.ratingLabel = ratingLabel; }

    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }

    public List<String> getStrongPoints() { return strongPoints; }
    public void setStrongPoints(List<String> strongPoints) { this.strongPoints = strongPoints; }
}
