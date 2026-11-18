package com.smartrental.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Single-use token for password reset or email verification. Only a SHA-256 hash is stored. */
@Entity
@Table(name = "auth_tokens", indexes = @Index(name = "idx_token_hash", columnList = "token_hash", unique = true))
@Getter
@Setter
@NoArgsConstructor
public class AuthToken {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    /** PASSWORD_RESET or EMAIL_VERIFY */
    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
