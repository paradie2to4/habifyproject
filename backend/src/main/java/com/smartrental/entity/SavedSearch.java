package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** A tenant's saved filters. With alerts on, new matching listings trigger a notification. */
@Entity
@Table(name = "saved_searches", indexes = @Index(name = "idx_saved_user", columnList = "user_id"))
@Getter
@Setter
@NoArgsConstructor
public class SavedSearch {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(nullable = false, length = 120)
    private String name;

    /** Comma-separated sector names; empty = anywhere */
    @Column(columnDefinition = "TEXT")
    private String sectors;

    @Column(length = 60)
    private String province;

    @Column(length = 60)
    private String district;

    @Column(name = "property_type", length = 20)
    private String propertyType;

    @Column(name = "min_rent")
    private Double minRent;

    @Column(name = "max_rent")
    private Double maxRent;

    @Column(name = "min_bedrooms")
    private Integer minBedrooms;

    private Boolean furnished;

    private Boolean parking;

    /** Comma-separated amenity labels that must all be present */
    @Column(columnDefinition = "TEXT")
    private String amenities;

    @Column(name = "alerts_enabled")
    private Boolean alertsEnabled = true;

    @Column(name = "match_count")
    private Integer matchCount = 0;

    @Column(name = "last_alert_at")
    private LocalDateTime lastAlertAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
