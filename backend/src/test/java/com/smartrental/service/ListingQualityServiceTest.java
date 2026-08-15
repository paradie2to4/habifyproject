package com.smartrental.service;

import com.smartrental.dto.ListingQualityDto;
import com.smartrental.entity.Property;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Listing Quality Service Unit Tests")
class ListingQualityServiceTest {

    private ListingQualityService qualityService;

    @BeforeEach
    void setUp() {
        qualityService = new ListingQualityService();
    }

    @Test
    @DisplayName("Should award 100% EXCELLENT for fully detailed listing")
    void testCompleteListingQuality() {
        Property prop = new Property();
        prop.setId("prop-100");
        prop.setTitle("Luxury Villa in Nyarutarama with Pool & Garden");
        prop.setDescription("Exceptional 4-bedroom executive villa located in prime Nyarutarama near international schools, featuring backup solar system, private swimming pool, landscaped garden, and high-speed fiber.");
        prop.setLocationSector("Nyarutarama");
        prop.setAddress("KG 9 Ave, Nyarutarama");
        prop.setSizeSqm(280.0);
        prop.setMonthlyRent(2000000.0);
        prop.setSecurityDeposit(2000000.0);
        prop.setAmenities("Water Tank, Solar Heating, Backup Generator, 24/7 Security Guard, Fiber Internet, Swimming Pool");
        prop.setImages("https://images.unsplash.com/photo-1?w=800,https://images.unsplash.com/photo-2?w=800,https://images.unsplash.com/photo-3?w=800,https://images.unsplash.com/photo-4?w=800");

        ListingQualityDto quality = qualityService.evaluateListingQuality(prop);

        assertNotNull(quality);
        assertEquals(100, quality.getQualityScore());
        assertEquals("EXCELLENT", quality.getRatingLabel());
        assertTrue(quality.getRecommendations().isEmpty(), "Perfect listing has no pending recommendations");
        assertTrue(quality.getStrongPoints().size() >= 4);
    }

    @Test
    @DisplayName("Should generate actionable recommendations for sparse listing")
    void testSparseListingQuality() {
        Property prop = new Property();
        prop.setId("prop-sparse");
        prop.setTitle("Room for rent");
        prop.setDescription("Nice room.");
        prop.setLocationSector("Gisozi");
        prop.setAddress("Gisozi");
        prop.setSizeSqm(null); // Missing size
        prop.setMonthlyRent(150000.0);
        prop.setSecurityDeposit(null); // Missing deposit
        prop.setAmenities(""); // Missing amenities
        prop.setImages("https://images.unsplash.com/photo-1?w=800"); // Only 1 photo

        ListingQualityDto quality = qualityService.evaluateListingQuality(prop);

        assertNotNull(quality);
        assertTrue(quality.getQualityScore() < 50);
        assertEquals("NEEDS_IMPROVEMENT", quality.getRatingLabel());
        assertTrue(quality.getRecommendations().stream().anyMatch(r -> r.contains("photos")));
        assertTrue(quality.getRecommendations().stream().anyMatch(r -> r.contains("description")));
        assertTrue(quality.getRecommendations().stream().anyMatch(r -> r.contains("square meters") || r.contains("size")));
    }
}
