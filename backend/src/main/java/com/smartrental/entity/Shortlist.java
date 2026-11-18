package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** A set of homes a tenant shares by link so family or roommates can vote on them. */
@Entity
@Table(name = "shortlists", indexes = {
        @Index(name = "idx_shortlist_owner", columnList = "owner_id"),
        @Index(name = "idx_shortlist_token", columnList = "share_token", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
public class Shortlist {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "owner_id", nullable = false, length = 50)
    private String ownerId;

    @Column(name = "owner_name")
    private String ownerName;

    @Column(nullable = false, length = 120)
    private String title;

    /** Unguessable link token; anyone with it can view and vote */
    @Column(name = "share_token", nullable = false, length = 40)
    private String shareToken;

    /** Comma-separated property ids, in the owner's order */
    @Column(name = "property_ids", columnDefinition = "TEXT")
    private String propertyIds;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}
