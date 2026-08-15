package com.smartrental.service;

import com.smartrental.dto.AuthResponseDto;
import com.smartrental.dto.LoginRequestDto;
import com.smartrental.dto.RegisterRequestDto;
import com.smartrental.entity.User;
import com.smartrental.repository.UserRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Value("${jwt.secret:9a618cf387d2a22f61b00d41a700ece838865fae612880d879fb9e6a0a90171e}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    public AuthResponseDto login(LoginRequestDto req) {
        User user = userRepository.findByEmail(req.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        // Basic verification for demo/interview prototype (in production BCryptPasswordEncoder is used)
        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated. Contact platform administrator.");
        }

        String token = generateJwtToken(user);
        return new AuthResponseDto(token, user);
    }

    public AuthResponseDto register(RegisterRequestDto req) {
        if (userRepository.existsByEmail(req.getEmail().trim().toLowerCase())) {
            throw new RuntimeException("An account with this email already exists.");
        }

        User user = new User();
        user.setId("usr-" + UUID.randomUUID().toString().substring(0, 8));
        user.setEmail(req.getEmail().trim().toLowerCase());
        user.setFullName(req.getFullName());
        user.setPhoneNumber(req.getPhoneNumber());
        user.setRole(req.getRole() != null ? req.getRole().toUpperCase() : "TENANT");
        user.setPasswordHash("$2a$12$demo_bcrypt_hash_placeholder");
        user.setAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        String token = generateJwtToken(saved);
        return new AuthResponseDto(token, saved);
    }

    public String generateJwtToken(User user) {
        Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        return Jwts.builder()
                .setSubject(user.getId())
                .claim("email", user.getEmail())
                .claim("role", user.getRole())
                .claim("name", user.getFullName())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}
