package com.smartrental.service;

import com.smartrental.entity.Property;
import com.smartrental.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class PropertyService {

    @Autowired
    private PropertyRepository propertyRepository;

    public List<Property> getAllAvailableProperties() {
        return propertyRepository.findByIsAvailableTrue();
    }

    public List<Property> getAllPropertiesForAdmin() {
        return propertyRepository.findAll();
    }

    public Optional<Property> getPropertyById(String id) {
        Optional<Property> prop = propertyRepository.findById(id);
        prop.ifPresent(p -> {
            p.setViewsCount((p.getViewsCount() == null ? 0 : p.getViewsCount()) + 1);
            propertyRepository.save(p);
        });
        return prop;
    }

    /** Lookup without bumping the view counter. */
    public Optional<Property> findById(String id) {
        return propertyRepository.findById(id);
    }

    public List<Property> getPropertiesByLandlord(String landlordId) {
        return propertyRepository.findByLandlordId(landlordId);
    }

    public Property createProperty(Property property) {
        if (property.getId() == null || property.getId().trim().isEmpty()) {
            property.setId("prop-" + UUID.randomUUID().toString().substring(0, 8));
        }
        property.setCreatedAt(LocalDateTime.now());
        if (property.getViewsCount() == null) property.setViewsCount(0);
        if (property.getIsAvailable() == null) property.setIsAvailable(true);
        return propertyRepository.save(property);
    }

    public Property updateProperty(String id, Property updated) {
        return propertyRepository.findById(id).map(existing -> {
            existing.setTitle(updated.getTitle());
            existing.setDescription(updated.getDescription());
            existing.setLocationSector(updated.getLocationSector());
            existing.setAddress(updated.getAddress());
            existing.setMonthlyRent(updated.getMonthlyRent());
            existing.setSecurityDeposit(updated.getSecurityDeposit());
            existing.setPropertyType(updated.getPropertyType());
            existing.setBedrooms(updated.getBedrooms());
            existing.setBathrooms(updated.getBathrooms());
            existing.setSizeSqm(updated.getSizeSqm());
            existing.setIsFurnished(updated.getIsFurnished());
            existing.setHasParking(updated.getHasParking());
            existing.setIsAvailable(updated.getIsAvailable());
            existing.setFeatured(updated.getFeatured());
            existing.setAmenities(updated.getAmenities());
            existing.setImages(updated.getImages());
            if (updated.getLatitude() != null) existing.setLatitude(updated.getLatitude());
            if (updated.getLongitude() != null) existing.setLongitude(updated.getLongitude());
            return propertyRepository.save(existing);
        }).orElseThrow(() -> new RuntimeException("Property not found with id: " + id));
    }

    public void deleteProperty(String id) {
        propertyRepository.deleteById(id);
    }

    public List<Property> search(String sector, String propType, Double maxPrice, Integer minBeds, Boolean furnished) {
        return propertyRepository.searchProperties(sector, propType, maxPrice, minBeds, furnished);
    }
}
