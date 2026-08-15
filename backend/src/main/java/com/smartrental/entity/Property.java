package com.smartrental.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "properties")
public class Property {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "landlord_id", nullable = false)
    private String landlordId;

    @Column(name = "landlord_name")
    private String landlordName;

    @Column(name = "landlord_phone")
    private String landlordPhone;

    @Column(name = "landlord_email")
    private String landlordEmail;

    @Column(name = "landlord_avatar")
    private String landlordAvatar;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "location_sector", nullable = false)
    private String locationSector;

    @Column(nullable = false)
    private String address;

    @Column(name = "monthly_rent", nullable = false)
    private Double monthlyRent;

    @Column(name = "security_deposit")
    private Double securityDeposit;

    @Column(name = "property_type", nullable = false)
    private String propertyType; // APARTMENT, HOUSE, VILLA, STUDIO, TOWNHOUSE, DUPLEX

    @Column(nullable = false)
    private Integer bedrooms = 1;

    @Column(nullable = false)
    private Integer bathrooms = 1;

    @Column(name = "size_sqm")
    private Double sizeSqm;

    @Column(name = "is_furnished")
    private Boolean isFurnished = false;

    @Column(name = "has_parking")
    private Boolean hasParking = false;

    @Column(name = "is_available")
    private Boolean isAvailable = true;

    private Boolean featured = false;

    @Column(name = "views_count")
    private Integer viewsCount = 0;

    private Double latitude;
    private Double longitude;

    @Column(columnDefinition = "TEXT")
    private String amenities; // Comma-delimited

    @Column(columnDefinition = "TEXT")
    private String images; // Comma-delimited

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Property() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLandlordId() { return landlordId; }
    public void setLandlordId(String landlordId) { this.landlordId = landlordId; }

    public String getLandlordName() { return landlordName; }
    public void setLandlordName(String landlordName) { this.landlordName = landlordName; }

    public String getLandlordPhone() { return landlordPhone; }
    public void setLandlordPhone(String landlordPhone) { this.landlordPhone = landlordPhone; }

    public String getLandlordEmail() { return landlordEmail; }
    public void setLandlordEmail(String landlordEmail) { this.landlordEmail = landlordEmail; }

    public String getLandlordAvatar() { return landlordAvatar; }
    public void setLandlordAvatar(String landlordAvatar) { this.landlordAvatar = landlordAvatar; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocationSector() { return locationSector; }
    public void setLocationSector(String locationSector) { this.locationSector = locationSector; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public Double getMonthlyRent() { return monthlyRent; }
    public void setMonthlyRent(Double monthlyRent) { this.monthlyRent = monthlyRent; }

    public Double getSecurityDeposit() { return securityDeposit; }
    public void setSecurityDeposit(Double securityDeposit) { this.securityDeposit = securityDeposit; }

    public String getPropertyType() { return propertyType; }
    public void setPropertyType(String propertyType) { this.propertyType = propertyType; }

    public Integer getBedrooms() { return bedrooms; }
    public void setBedrooms(Integer bedrooms) { this.bedrooms = bedrooms; }

    public Integer getBathrooms() { return bathrooms; }
    public void setBathrooms(Integer bathrooms) { this.bathrooms = bathrooms; }

    public Double getSizeSqm() { return sizeSqm; }
    public void setSizeSqm(Double sizeSqm) { this.sizeSqm = sizeSqm; }

    public Boolean getIsFurnished() { return isFurnished; }
    public void setIsFurnished(Boolean isFurnished) { this.isFurnished = isFurnished; }

    public Boolean getHasParking() { return hasParking; }
    public void setHasParking(Boolean hasParking) { this.hasParking = hasParking; }

    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }

    public Boolean getFeatured() { return featured; }
    public void setFeatured(Boolean featured) { this.featured = featured; }

    public Integer getViewsCount() { return viewsCount; }
    public void setViewsCount(Integer viewsCount) { this.viewsCount = viewsCount; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getAmenities() { return amenities; }
    public void setAmenities(String amenities) { this.amenities = amenities; }

    public String getImages() { return images; }
    public void setImages(String images) { this.images = images; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
