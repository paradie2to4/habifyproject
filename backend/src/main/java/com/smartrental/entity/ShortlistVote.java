package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** One person's vote (and optional comment) on one home in a shared shortlist. */
@Entity
@Table(name = "shortlist_votes", uniqueConstraints = @UniqueConstraint(columnNames = {"shortlist_id", "property_id", "voter_key"}))
@Getter
@Setter
@NoArgsConstructor
public class ShortlistVote {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "shortlist_id", nullable = false, length = 50)
    private String shortlistId;

    @Column(name = "property_id", nullable = false, length = 50)
    private String propertyId;

    /** Random id kept in the voter's browser, so one person = one vote without an account */
    @Column(name = "voter_key", nullable = false, length = 64)
    private String voterKey;

    @Column(name = "voter_name", nullable = false, length = 60)
    private String voterName;

    /** +1 = love it, -1 = not for us */
    @Column(name = "vote_value", nullable = false)
    private Integer value;

    @Column(length = 280)
    private String comment;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
