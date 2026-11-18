package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** In-app notification shown in the bell; optionally mirrored by email. */
@Entity
@Table(name = "notifications", indexes = @Index(name = "idx_notif_user", columnList = "user_id, created_at"))
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    /** VIEWING_REQUESTED, VIEWING_UPDATED, NEW_MESSAGE, NEW_INQUIRY, RENT_DUE, PAYMENT, LEASE, MAINTENANCE, ACCOUNT */
    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    /** In-app path to open, e.g. /messages or /properties/prop-01 */
    private String link;

    /** De-duplication key for scheduled reminders (e.g. RENT_DUE:lease-1:2026-11) */
    @Column(name = "dedupe_key", length = 120)
    private String dedupeKey;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
