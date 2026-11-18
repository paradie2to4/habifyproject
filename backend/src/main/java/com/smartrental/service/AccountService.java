package com.smartrental.service;

import com.smartrental.entity.AuthToken;
import com.smartrental.entity.Lease;
import com.smartrental.entity.User;
import com.smartrental.exception.ApiException;
import com.smartrental.repository.AuthTokenRepository;
import com.smartrental.repository.LeaseRepository;
import com.smartrental.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;

/** Profile, password and email-verification flows. */
@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);
    public static final String RESET = "PASSWORD_RESET";
    public static final String VERIFY = "EMAIL_VERIFY";
    public static final int MIN_PASSWORD_LENGTH = 8;

    private final UserRepository users;
    private final AuthTokenRepository tokens;
    private final LeaseRepository leases;
    private final PasswordEncoder encoder;
    private final EmailService email;
    private final SecureRandom random = new SecureRandom();

    public AccountService(UserRepository users, AuthTokenRepository tokens, LeaseRepository leases,
                          PasswordEncoder encoder, EmailService email) {
        this.users = users;
        this.tokens = tokens;
        this.leases = leases;
        this.encoder = encoder;
        this.email = email;
    }

    private User user(String id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
    }

    // ---------------------------------------------------------------- profile

    @Transactional
    public User updateProfile(String userId, String fullName, String phoneNumber, String avatarUrl) {
        User u = user(userId);
        if (fullName != null) {
            if (fullName.isBlank()) throw ApiException.badRequest("Name can’t be empty");
            if (fullName.length() > 150) throw ApiException.badRequest("Name is too long");
            u.setFullName(fullName.trim());
        }
        if (phoneNumber != null) u.setPhoneNumber(phoneNumber.isBlank() ? null : phoneNumber.trim());
        if (avatarUrl != null) u.setAvatarUrl(avatarUrl.isBlank() ? null : avatarUrl.trim());
        return users.save(u);
    }

    @Transactional
    public void changePassword(String userId, String current, String next) {
        User u = user(userId);
        if (current == null || !encoder.matches(current, u.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Your current password is incorrect");
        }
        validatePassword(next);
        u.setPasswordHash(encoder.encode(next));
        users.save(u);
    }

    public static void validatePassword(String pw) {
        if (pw == null || pw.length() < MIN_PASSWORD_LENGTH) {
            throw ApiException.badRequest("Password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
    }

    // ---------------------------------------------------------------- tokens

    /** Package-private so integration tests can obtain a raw token (it is only ever emailed otherwise). */
    String issue(String userId, String type, int validMinutes) {
        // Invalidate earlier unused tokens of the same type
        tokens.findByUserIdAndTypeAndUsedAtIsNull(userId, type).forEach(t -> {
            t.setUsedAt(LocalDateTime.now());
            tokens.save(t);
        });
        byte[] raw = new byte[32];
        random.nextBytes(raw);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        AuthToken t = new AuthToken();
        t.setId(NotificationService.newId("tok"));
        t.setTokenHash(hash(token));
        t.setUserId(userId);
        t.setType(type);
        t.setExpiresAt(LocalDateTime.now().plusMinutes(validMinutes));
        tokens.save(t);
        return token;
    }

    private AuthToken consume(String token, String type) {
        if (token == null || token.isBlank()) throw ApiException.badRequest("This link is invalid");
        AuthToken t = tokens.findByTokenHash(hash(token.trim()))
                .filter(x -> x.getType().equals(type))
                .orElseThrow(() -> ApiException.badRequest("This link is invalid or has already been used"));
        if (t.getUsedAt() != null) throw ApiException.badRequest("This link has already been used");
        if (t.getExpiresAt().isBefore(LocalDateTime.now())) throw ApiException.badRequest("This link has expired. Request a new one.");
        t.setUsedAt(LocalDateTime.now());
        tokens.save(t);
        return t;
    }

    static String hash(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    // ---------------------------------------------------------------- password reset

    /** Always succeeds from the caller's point of view, so accounts can't be discovered by email. */
    @Transactional
    public void requestPasswordReset(String rawEmail) {
        if (rawEmail == null) return;
        users.findByEmail(rawEmail.trim().toLowerCase()).ifPresent(u -> {
            String token = issue(u.getId(), RESET, 60);
            String first = u.getFullName() == null ? "there" : u.getFullName().split(" ")[0];
            email.send(u.getEmail(), "Reset your Habify password", "Reset your password",
                    List.of("Hi " + first + ",",
                            "We received a request to reset your Habify password. The link below works once and expires in 1 hour.",
                            "If you didn’t ask for this, you can ignore this email — your password won’t change."),
                    "Choose a new password", "/reset-password?token=" + token);
            log.info("Password reset requested for user {}", u.getId());
        });
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        validatePassword(newPassword);
        AuthToken t = consume(token, RESET);
        User u = user(t.getUserId());
        u.setPasswordHash(encoder.encode(newPassword));
        // Receiving the reset email proves the address works
        u.setEmailVerified(true);
        users.save(u);
    }

    // ---------------------------------------------------------------- email verification

    @Transactional
    public void sendVerification(String userId) {
        User u = user(userId);
        if (Boolean.TRUE.equals(u.getEmailVerified())) return;
        String token = issue(u.getId(), VERIFY, 60 * 48);
        String first = u.getFullName() == null ? "there" : u.getFullName().split(" ")[0];
        email.send(u.getEmail(), "Confirm your email for Habify", "Confirm your email",
                List.of("Hi " + first + ", welcome to Habify!",
                        "Please confirm this is your email address so we can send you viewing updates, messages and rent reminders. The link expires in 48 hours."),
                "Confirm my email", "/verify-email?token=" + token);
    }

    @Transactional
    public User verifyEmail(String token) {
        AuthToken t = consume(token, VERIFY);
        User u = user(t.getUserId());
        u.setEmailVerified(true);
        linkPendingLeases(u);
        return users.save(u);
    }

    /** Connect leases a landlord created for this email before the tenant signed up. */
    @Transactional
    public int linkPendingLeases(User u) {
        List<Lease> pending = leases.findByTenantIdIsNullAndTenantEmailIgnoreCase(u.getEmail());
        pending.forEach(l -> {
            l.setTenantId(u.getId());
            leases.save(l);
        });
        return pending.size();
    }
}
