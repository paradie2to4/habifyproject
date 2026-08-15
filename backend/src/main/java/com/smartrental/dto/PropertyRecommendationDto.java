package com.smartrental.dto;

import com.smartrental.entity.Property;

public class PropertyRecommendationDto {
    private Property property;
    private MatchExplanationDto matchExplanation;

    public PropertyRecommendationDto() {}

    public PropertyRecommendationDto(Property property, MatchExplanationDto matchExplanation) {
        this.property = property;
        this.matchExplanation = matchExplanation;
    }

    public Property getProperty() { return property; }
    public void setProperty(Property property) { this.property = property; }

    public MatchExplanationDto getMatchExplanation() { return matchExplanation; }
    public void setMatchExplanation(MatchExplanationDto matchExplanation) { this.matchExplanation = matchExplanation; }
}
