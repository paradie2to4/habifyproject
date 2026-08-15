package com.smartrental.service;

import com.smartrental.dto.ListingQualityDto;
import com.smartrental.entity.Property;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ListingQualityService {

    /**
     * Computes listing quality score (0-100%) and actionable optimization advice
     * for property landlords to maximize inquiry and viewing conversion rates.
     */
    public ListingQualityDto evaluateListingQuality(Property prop) {
        ListingQualityDto dto = new ListingQualityDto();
        List<String> recommendations = new ArrayList<>();
        List<String> strongPoints = new ArrayList<>();
        int score = 0;

        // 1. Photos & Gallery (Max 25 pts)
        if (prop.getImages() != null && !prop.getImages().trim().isEmpty()) {
            String[] imgs = prop.getImages().split(",");
            if (imgs.length >= 4) {
                score += 25;
                strongPoints.add(String.format("Rich visual gallery (%d photos attached)", imgs.length));
            } else if (imgs.length >= 2) {
                score += 18;
                recommendations.add("Add at least 4 photos (living room, bedroom, kitchen, exterior) to achieve max photo score.");
            } else {
                score += 10;
                recommendations.add("Only 1 photo uploaded. Listings with 4+ photos receive 3.5x more viewing bookings.");
            }
        } else {
            recommendations.add("Crucial: Upload clear photos of the property to attract verified tenants.");
        }

        // 2. Comprehensive Description (Max 20 pts)
        if (prop.getDescription() != null && prop.getDescription().trim().length() >= 120) {
            score += 20;
            strongPoints.add("Detailed, descriptive listing overview");
        } else if (prop.getDescription() != null && prop.getDescription().trim().length() >= 40) {
            score += 12;
            recommendations.add("Expand description to 120+ characters detailing neighborhood vibe, transport, and utilities.");
        } else {
            score += 4;
            recommendations.add("Write an informative description highlighting nearby landmarks, security, and lease terms.");
        }

        // 3. Infrastructure & Amenities Specified (Max 20 pts)
        if (prop.getAmenities() != null && !prop.getAmenities().trim().isEmpty()) {
            String[] amenities = prop.getAmenities().split(",");
            if (amenities.length >= 5) {
                score += 20;
                strongPoints.add(String.format("Comprehensive amenities checklist (%d tags included)", amenities.length));
            } else if (amenities.length >= 2) {
                score += 14;
                recommendations.add("Tag additional Kigali infrastructure (e.g. Water Tank, Solar Heating, Backup Generator, Fiber).");
            } else {
                score += 8;
                recommendations.add("Add more amenities to improve search filtering discovery.");
            }
        } else {
            recommendations.add("Specify amenities (Water Tank, High-speed Internet, 24/7 Security, Balcony).");
        }

        // 4. Floor Area & Sizing (Max 15 pts)
        if (prop.getSizeSqm() != null && prop.getSizeSqm() > 0) {
            score += 15;
            strongPoints.add(String.format("Floor dimensions provided (%.0f m²)", prop.getSizeSqm()));
        } else {
            recommendations.add("Specify total floor area in square meters (m²) so tenants can assess space adequacy.");
        }

        // 5. Financial Transparency (Security Deposit specified) (Max 10 pts)
        if (prop.getSecurityDeposit() != null && prop.getSecurityDeposit() > 0) {
            score += 10;
            strongPoints.add("Clear security deposit requirements stated upfront");
        } else {
            score += 4;
            recommendations.add("Indicate expected security deposit terms to minimize tenant application friction.");
        }

        // 6. Complete Contact & Address info (Max 10 pts)
        if (prop.getAddress() != null && !prop.getAddress().trim().isEmpty() &&
            prop.getLocationSector() != null && !prop.getLocationSector().trim().isEmpty()) {
            score += 10;
            strongPoints.add("Precise physical address and Kigali sector designated");
        } else {
            score += 3;
            recommendations.add("Provide exact street/cell location and sector details.");
        }

        dto.setPropertyId(prop.getId());
        dto.setQualityScore(Math.min(100, score));
        dto.setRecommendations(recommendations);
        dto.setStrongPoints(strongPoints);

        if (score >= 85) {
            dto.setRatingLabel("EXCELLENT");
        } else if (score >= 70) {
            dto.setRatingLabel("GOOD");
        } else if (score >= 50) {
            dto.setRatingLabel("FAIR");
        } else {
            dto.setRatingLabel("NEEDS_IMPROVEMENT");
        }

        return dto;
    }
}
