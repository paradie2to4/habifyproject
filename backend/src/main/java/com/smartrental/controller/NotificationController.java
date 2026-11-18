package com.smartrental.controller;

import com.smartrental.entity.Notification;
import com.smartrental.security.CurrentUser;
import com.smartrental.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** The signed-in user's notification bell. */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notifications;

    public NotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(@RequestParam(defaultValue = "30") int limit) {
        String userId = CurrentUser.get().id();
        List<Notification> items = notifications.recent(userId, limit);
        return ResponseEntity.ok(Map.of("items", items, "unread", notifications.unreadCount(userId)));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Notification> read(@PathVariable String id) {
        return ResponseEntity.ok(notifications.markRead(CurrentUser.get().id(), id));
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, Object>> readAll() {
        return ResponseEntity.ok(Map.of("updated", notifications.markAllRead(CurrentUser.get().id())));
    }
}
