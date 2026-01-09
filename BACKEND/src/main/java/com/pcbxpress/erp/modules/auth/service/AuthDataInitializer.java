package com.pcbxpress.erp.modules.auth.service;

import com.pcbxpress.erp.modules.auth.model.User;
import com.pcbxpress.erp.modules.auth.model.UserRole;
import com.pcbxpress.erp.modules.auth.model.UserStatus;
import com.pcbxpress.erp.modules.auth.repository.UserRepository;
import java.time.ZonedDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Ensures default admin/user accounts exist in Postgres for quick local login.
 */
@Component
public class AuthDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthDataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUser("admin", "admin@pcbxpress.com", "admin123", "Admin", "User", UserRole.ADMIN);
        seedUser("user", "user@pcbxpress.com", "user123", "Demo", "User", UserRole.USER);
    }

    private void seedUser(String username, String email, String rawPassword,
                          String firstName, String lastName, UserRole role) {
        User user = userRepository.findByUsername(username)
            .or(() -> userRepository.findByEmail(email))
            .orElse(null);

        if (user == null) {
            user = new User(username, email, passwordEncoder.encode(rawPassword), firstName, lastName, role);
        } else {
            if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
                user.setPasswordHash(passwordEncoder.encode(rawPassword));
            }
            user.setUsername(username);
            user.setEmail(email);
            user.setRole(role);
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(true);
        user.setLockedUntil(null);
        user.setFailedLoginAttempts(0);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setCreatedAt(user.getCreatedAt() == null ? ZonedDateTime.now() : user.getCreatedAt());
        user.setUpdatedAt(ZonedDateTime.now());
        userRepository.save(user);
    }
}
