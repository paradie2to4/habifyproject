package com.smartrental.controller;

import com.smartrental.security.CurrentUser;
import com.smartrental.service.ShortlistService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/** Owner endpoints are signed-in; /api/public/shortlists/{token} is open to anyone holding the link. */
@RestController
public class ShortlistController {

    private final ShortlistService service;

    public ShortlistController(ShortlistService service) {
        this.service = service;
    }

    @GetMapping("/api/shortlists")
    public ResponseEntity<List<Map<String, Object>>> mine() {
        return ResponseEntity.ok(service.mine(CurrentUser.get().id()));
    }

    @PostMapping("/api/shortlists")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(CurrentUser.get().id(), (String) body.get("title"), list(body.get("propertyIds"))));
    }

    @PutMapping("/api/shortlists/{id}")
    public ResponseEntity<Map<String, Object>> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(service.update(CurrentUser.get().id(), id, (String) body.get("title"),
                body.containsKey("propertyIds") ? list(body.get("propertyIds")) : null));
    }

    @PostMapping("/api/shortlists/{id}/new-link")
    public ResponseEntity<Map<String, Object>> newLink(@PathVariable String id) {
        return ResponseEntity.ok(service.rotateLink(CurrentUser.get().id(), id));
    }

    @DeleteMapping("/api/shortlists/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(CurrentUser.get().id(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/public/shortlists/{token}")
    public ResponseEntity<Map<String, Object>> publicView(@PathVariable String token) {
        return ResponseEntity.ok(service.publicView(token));
    }

    @PostMapping("/api/public/shortlists/{token}/votes")
    public ResponseEntity<Map<String, Object>> vote(@PathVariable String token, @RequestBody Map<String, Object> body) {
        int value = body.get("value") instanceof Number n ? n.intValue() : 0;
        return ResponseEntity.ok(service.vote(token, (String) body.get("propertyId"), (String) body.get("voterKey"),
                (String) body.get("voterName"), value, (String) body.get("comment")));
    }

    private static Collection<?> list(Object o) {
        return o instanceof Collection<?> c ? c : List.of();
    }
}
