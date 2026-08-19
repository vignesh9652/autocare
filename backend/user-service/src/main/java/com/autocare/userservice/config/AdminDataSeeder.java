package com.autocare.userservice.config;

import com.autocare.userservice.entity.AccountStatus;
import com.autocare.userservice.entity.Role;
import com.autocare.userservice.entity.User;
import com.autocare.userservice.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the predefined ADMIN account on startup (idempotent).
 *
 * <p>Admins are not self-registerable — the credentials are configured in
 * {@code application.yml} under {@code app.admin} (overridable via the
 * {@code APP_ADMIN_EMAIL} / {@code APP_ADMIN_PASSWORD} env vars) and created
 * here on first boot if they don't exist yet.</p>
 */
@Component
public class AdminDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminDataSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    public AdminDataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmail(adminEmail)) {
            return;
        }

        User admin = new User(
                "AutoCare Administrator",
                adminEmail,
                passwordEncoder.encode(adminPassword),
                "0000000000",
                Role.ADMIN
        );
        admin.setStatus(AccountStatus.APPROVED);
        userRepository.save(admin);

        log.info("🔐 Seeded default ADMIN account: {}", adminEmail);
    }
}
