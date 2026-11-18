package com.smartrental.controller;

import com.smartrental.entity.SavedSearch;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.SavedSearchService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved-searches")
public class SavedSearchController {

    private final SavedSearchService service;

    public SavedSearchController(SavedSearchService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SavedSearch>> mine() {
        return ResponseEntity.ok(service.mine(CurrentUser.get().id()));
    }

    @PostMapping
    public ResponseEntity<SavedSearch> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(CurrentUser.get().id(), body));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SavedSearch> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.update(CurrentUser.get().id(), id, body));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(CurrentUser.get().id(), id);
        return ResponseEntity.noContent().build();
    }
}
