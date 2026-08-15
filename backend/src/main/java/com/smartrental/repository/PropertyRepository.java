package com.smartrental.repository;

import com.smartrental.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, String> {

    List<Property> findByLandlordId(String landlordId);

    List<Property> findByIsAvailableTrue();

    List<Property> findByFeaturedTrueAndIsAvailableTrue();

    @Query("SELECT p FROM Property p WHERE p.isAvailable = true " +
           "AND (:sector IS NULL OR LOWER(p.locationSector) = LOWER(:sector)) " +
           "AND (:propType IS NULL OR p.propertyType = :propType) " +
           "AND (:maxPrice IS NULL OR p.monthlyRent <= :maxPrice) " +
           "AND (:minBeds IS NULL OR p.bedrooms >= :minBeds) " +
           "AND (:furnished IS NULL OR p.isFurnished = :furnished)")
    List<Property> searchProperties(
            @Param("sector") String sector,
            @Param("propType") String propType,
            @Param("maxPrice") Double maxPrice,
            @Param("minBeds") Integer minBeds,
            @Param("furnished") Boolean furnished
    );
}
