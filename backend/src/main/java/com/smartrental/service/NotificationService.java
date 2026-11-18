package com.smartrental.service;

import com.smartrental.entity.Notification;
import com.smartrental.entity.User;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.NotificationRepository;
import com.smartrental.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/** Creates in-app notifications and mirrors the important ones by email. */
@Service
public class NotificationService {

    private final NotificationRepository repo;
    private final UserRepository users;
    private final EmailService email;

    public NotificationService(NotificationRepository repo, UserRepository users, EmailService email) {
        this.repo = repo;
        this.users = users;
        this.email = email;
    }

    public static String newId(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    /**
     * Notify a user in-app, and by email when {@code sendEmail} is true.
     * Silently skips unknown or empty user ids (e.g. a lease whose tenant has no account yet).
     */
    @Transactional
    public void notify(String userId, String type, String title, String body, String link, boolean sendEmail) {
        notify(userId, type, title, body, link, sendEmail, null);
    }

    /** Same as {@link #notify}, but only once per {@code dedupeKey} (used by scheduled reminders). */
    @Transactional
    public boolean notify(String userId, String type, String title, String body, String link, boolean sendEmail, String dedupeKey) {
        if (userId == null || userId.isBlank()) return false;
        if (dedupeKey != null && repo.existsByUserIdAndDedupeKey(userId, dedupeKey)) return false;
        User user = users.findById(userId).orElse(null);
        if (user == null) return false;

        Notification n = new Notification();
        n.setId(newId("ntf"));
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setBody(body);
        n.setLink(link);
        n.setDedupeKey(dedupeKey);
        n.setCreatedAt(LocalDateTime.now());
        repo.save(n);

        // Email only confirmed addresses of accounts that aren't deactivated
        if (sendEmail && !Boolean.FALSE.equals(user.getIsActive()) && Boolean.TRUE.equals(user.getEmailVerified())) {
            String first = user.getFullName() == null ? "there" : user.getFullName().split(" ")[0];
            email.send(user.getEmail(), title, title, List.of("Hi " + first + ",", body), "Open Habify", link);
        }
        return true;
    }

    public List<Notification> recent(String userId, int limit) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, Math.min(Math.max(limit, 1), 100)));
    }

    public long unreadCount(String userId) {
        return repo.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public Notification markRead(String userId, String id) {
        Notification n = repo.findById(id).orElseThrow(() -> ApiException.notFound("Notification"));
        if (!n.getUserId().equals(userId)) throw ApiException.forbidden();
        if (n.getReadAt() == null) {
            n.setReadAt(LocalDateTime.now());
            repo.save(n);
        }
        return n;
    }

    @Transactional
    public int markAllRead(String userId) {
        return repo.markAllRead(userId, LocalDateTime.now());
    }
}
