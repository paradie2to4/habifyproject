package com.smartrental.security;

import com.smartrental.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

/** Issues and verifies HS256 JWTs. The secret must come from the JWT_SECRET env var in production. */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    static final String DEV_FALLBACK_SECRET = "habify-local-dev-secret-change-me-0123456789abcdef";

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret:}") String secret,
            @Value("${jwt.expiration:86400000}") long expirationMs
    ) {
        String effective = secret;
        if (effective == null || effective.isBlank()) {
            log.warn("JWT_SECRET is not set — using an insecure development secret. Set JWT_SECRET in production!");
            effective = DEV_FALLBACK_SECRET;
        }
        if (effective.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes long");
        }
        this.key = Keys.hmacShaKeyFor(effective.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Date now = new Date();
        return Jwts.builder()
                .subject(user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole())
                .claim("name", user.getFullName())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    /** Returns the authenticated principal if the token is valid and unexpired. */
    public Optional<AuthUser> parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            String role = claims.get("role", String.class);
            return Optional.of(new AuthUser(
                    claims.getSubject(),
                    claims.get("email", String.class),
                    role == null ? "TENANT" : role.toUpperCase()
            ));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
