package com.smartrental.repository;

import com.smartrental.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, String> {
    List<Favorite> findByUserId(String userId);
    Optional<Favorite> findByUserIdAndPropertyId(String userId, String propertyId);
    void deleteByUserIdAndPropertyId(String userId, String propertyId);
}
