package com.smartrental.service;

import com.smartrental.dto.AuthResponseDto;
import com.smartrental.dto.LoginRequestDto;
import com.smartrental.dto.RegisterRequestDto;
import com.smartrental.entity.User;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.UserRepository;
import com.smartrental.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    /** Hash written by older builds that never stored real passwords. */
    public static final String LEGACY_PLACEHOLDER_HASH = "$2a$12$demo_bcrypt_hash_placeholder";
    private static final Set<String> SELF_SERVICE_ROLES = Set.of("TENANT", "LANDLORD");
    private static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponseDto login(LoginRequestDto req) {
        if (req.getEmail() == null || req.getPassword() == null) {
            throw ApiException.badRequest("Email and password are required");
        }
        User user = userRepository.findByEmail(req.getEmail().trim().toLowerCase())
                .orElseThrow(AuthService::invalidCredentials);

        if (LEGACY_PLACEHOLDER_HASH.equals(user.getPasswordHash())) {
            // Accounts created before passwords were stored: the first successful login sets the password.
            log.info("Setting first password for legacy account {}", user.getId());
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
            userRepository.save(user);
        } else if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw invalidCredentials();
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is deactivated. Contact platform administrator.");
        }

        return new AuthResponseDto(jwtService.generateToken(user), user);
    }

    public AuthResponseDto register(RegisterRequestDto req) {
        if (req.getEmail() == null || !req.getEmail().contains("@")) {
            throw ApiException.badRequest("A valid email address is required");
        }
        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw ApiException.badRequest("Full name is required");
        }
        if (req.getPassword() == null || req.getPassword().length() < MIN_PASSWORD_LENGTH) {
            throw ApiException.badRequest("Password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        String role = req.getRole() != null ? req.getRole().trim().toUpperCase() : "TENANT";
        if (!SELF_SERVICE_ROLES.contains(role)) {
            throw ApiException.badRequest("You can only register as a tenant or landlord");
        }

        User user = new User();
        user.setId("usr-" + UUID.randomUUID().toString().substring(0, 8));
        user.setEmail(email);
        user.setFullName(req.getFullName().trim());
        user.setPhoneNumber(req.getPhoneNumber());
        user.setRole(role);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        return new AuthResponseDto(jwtService.generateToken(saved), saved);
    }

    public User getUser(String id) {
        return userRepository.findById(id).orElseThrow(() -> ApiException.notFound("User"));
    }

    private static ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
}
