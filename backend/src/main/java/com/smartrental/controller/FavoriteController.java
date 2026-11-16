package com.smartrental.controller;

import com.smartrental.entity.Favorite;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.FavoriteRepository;
import com.smartrental.repository.PropertyRepository;
import com.smartrental.security.CurrentUser;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Saved properties of the signed-in user. Responses are the list of saved property ids. */
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;
    private final PropertyRepository propertyRepository;

    public FavoriteController(FavoriteRepository favoriteRepository, PropertyRepository propertyRepository) {
        this.favoriteRepository = favoriteRepository;
        this.propertyRepository = propertyRepository;
    }

    @GetMapping
    public ResponseEntity<List<String>> list() {
        return ResponseEntity.ok(ids(CurrentUser.get().id()));
    }

    @PutMapping("/{propertyId}")
    @Transactional
    public ResponseEntity<List<String>> add(@PathVariable String propertyId) {
        String userId = CurrentUser.get().id();
        if (!propertyRepository.existsById(propertyId)) throw ApiException.notFound("Property");
        if (favoriteRepository.findByUserIdAndPropertyId(userId, propertyId).isEmpty()) {
            favoriteRepository.save(new Favorite("fav-" + UUID.randomUUID().toString().substring(0, 8), userId, propertyId));
        }
        return ResponseEntity.ok(ids(userId));
    }

    @DeleteMapping("/{propertyId}")
    @Transactional
    public ResponseEntity<List<String>> remove(@PathVariable String propertyId) {
        String userId = CurrentUser.get().id();
        favoriteRepository.deleteByUserIdAndPropertyId(userId, propertyId);
        return ResponseEntity.ok(ids(userId));
    }

    private List<String> ids(String userId) {
        return favoriteRepository.findByUserId(userId).stream().map(Favorite::getPropertyId).toList();
    }
}
