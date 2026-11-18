package com.smartrental.controller;

import com.smartrental.entity.Property;
import com.smartrental.exception.ApiException;
import com.smartrental.security.AuthUser;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.PropertyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {

    private final PropertyService propertyService;
    private final com.smartrental.service.SavedSearchService savedSearches;

    public PropertyController(PropertyService propertyService, com.smartrental.service.SavedSearchService savedSearches) {
        this.propertyService = propertyService;
        this.savedSearches = savedSearches;
    }

    @GetMapping
    public ResponseEntity<List<Property>> getAllProperties(
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) String propType,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Integer minBeds,
            @RequestParam(required = false) Boolean furnished
    ) {
        if (sector != null || propType != null || maxPrice != null || minBeds != null || furnished != null) {
            return ResponseEntity.ok(propertyService.search(sector, propType, maxPrice, minBeds, furnished));
        }
        return ResponseEntity.ok(propertyService.getAllAvailableProperties());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Property> getPropertyById(@PathVariable String id) {
        return propertyService.getPropertyById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> ApiException.notFound("Property"));
    }

    /** Includes unavailable listings, so only the owner (or an admin) may see it. */
    @GetMapping("/landlord/{landlordId}")
    public ResponseEntity<List<Property>> getByLandlord(@PathVariable String landlordId) {
        CurrentUser.requireSelfOrAdmin(landlordId);
        return ResponseEntity.ok(propertyService.getPropertiesByLandlord(landlordId));
    }

    @PostMapping
    public ResponseEntity<Property> createProperty(@RequestBody Property property) {
        AuthUser user = CurrentUser.get();
        if (!user.isAdmin() || property.getLandlordId() == null) {
            property.setLandlordId(user.id());
        }
        property.setId(null);
        Property created = propertyService.createProperty(property);
        savedSearches.onListingAvailable(created);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Property> updateProperty(@PathVariable String id, @RequestBody Property property) {
        boolean wasAvailable = Boolean.TRUE.equals(requireOwner(id).getIsAvailable());
        Property saved = propertyService.updateProperty(id, property);
        // A home that comes back on the market is news for people searching for it
        if (!wasAvailable) savedSearches.onListingAvailable(saved);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(@PathVariable String id) {
        requireOwner(id);
        propertyService.deleteProperty(id);
        return ResponseEntity.noContent().build();
    }

    private Property requireOwner(String propertyId) {
        Property existing = propertyService.findById(propertyId)
                .orElseThrow(() -> ApiException.notFound("Property"));
        CurrentUser.requireSelfOrAdmin(existing.getLandlordId());
        return existing;
    }
}
