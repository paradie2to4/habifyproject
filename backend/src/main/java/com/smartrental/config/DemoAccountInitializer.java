package com.smartrental.config;

import com.smartrental.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * data.sql seeds the demo accounts with a non-verifiable hash. On startup, give those
 * accounts a real BCrypt hash of the documented demo password so login works.
 * Only touches accounts that still carry the original seed hash.
 */
@Component
public class DemoAccountInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoAccountInitializer.class);
    static final String SEED_HASH = "$2a$12$0z3E9b9bK1VwB5wW7r6J6O3lOZb8bQvPqE1b9K1VwB5wW7r6J6O3l";
    static final String DEMO_PASSWORD = "password123";
    private static final List<String> DEMO_EMAILS = List.of(
            "tenant@smartrental.rw", "landlord@smartrental.rw", "admin@smartrental.rw");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoAccountInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        for (String email : DEMO_EMAILS) {
            userRepository.findByEmail(email).ifPresent(user -> {
                boolean changed = false;
                if (SEED_HASH.equals(user.getPasswordHash())) {
                    user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
                    changed = true;
                    log.info("Initialised demo password for {}", email);
                }
                // Seeded demo inboxes don't exist, so treat them as verified
                if (!Boolean.TRUE.equals(user.getEmailVerified())) {
                    user.setEmailVerified(true);
                    changed = true;
                }
                if (changed) userRepository.save(user);
            });
        }
    }
}
