package com.pcbxpress.erp.modules.auth.service;

import com.pcbxpress.erp.modules.auth.dto.AuthUserDto;
import com.pcbxpress.erp.modules.auth.dto.LoginRequest;
import com.pcbxpress.erp.modules.auth.dto.LoginResponse;
import com.pcbxpress.erp.modules.auth.jwt.JwtService;
import com.pcbxpress.erp.modules.auth.model.User;
import com.pcbxpress.erp.modules.auth.model.UserRole;
import com.pcbxpress.erp.modules.auth.model.UserStatus;
import com.pcbxpress.erp.modules.auth.repository.UserRepository;
import java.time.Duration;
import java.time.ZonedDateTime;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Autowired
    public AuthenticationService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest loginRequest) {
        String identifier = resolveIdentifier(loginRequest);
        String password = loginRequest.getPassword();

        // Find user by username or email
        Optional<User> userOpt = userRepository.findByUsernameOrEmail(identifier);
        
        User user = userOpt.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        // Auto-unlock if lock window has expired
        if (user.getStatus() == UserStatus.LOCKED && user.getLockedUntil() != null
            && user.getLockedUntil().isBefore(ZonedDateTime.now())) {
            user.setStatus(UserStatus.ACTIVE);
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
            userRepository.save(user);
        }

        // Check if account is active
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is " + user.getStatus().toString().toLowerCase());
        }

        // Check if account is locked
        if (user.isAccountLocked()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is locked. Try again later.");
        }

        // Verify password
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            handleFailedLogin(user);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        // Reset failed login attempts on successful login
        if (user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
        }

        // Update last login
        user.setLastLogin(ZonedDateTime.now());
        userRepository.save(user);

        // Create auth user DTO
        AuthUserDto authUser = new AuthUserDto(
            user.getId().toString(),
            user.getFullName(),
            user.getEmail(),
            user.getRole().name()
        );

        // Generate JWT access and refresh tokens
        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        
        // Set token expiration (2 hours for access token)
        ZonedDateTime expiresAt = ZonedDateTime.now().plus(Duration.ofHours(2));
        Long expiresIn = Duration.between(ZonedDateTime.now(), expiresAt).getSeconds();

        return new LoginResponse(accessToken, refreshToken, expiresIn, expiresAt, authUser);
    }

    public AuthUserDto getAuthenticatedUser(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();
        return new AuthUserDto(
            user.getId().toString(),
            user.getFullName(),
            user.getEmail(),
            user.getRole().name()
        );
    }

    public void logout(String username) {
        // In a real implementation, you would invalidate the token
        // For now, we'll just log the logout action
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            // Log audit trail or invalidate session
        }
    }

    private void handleFailedLogin(User user) {
        int failedAttempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(failedAttempts);

        // Lock account after 5 failed attempts for 30 minutes
        if (failedAttempts >= 5) {
            user.setLockedUntil(ZonedDateTime.now().plusMinutes(30));
            user.setStatus(UserStatus.LOCKED);
        }

        userRepository.save(user);
    }

    // Token generation and validation are delegated to JwtService

    private static String resolveIdentifier(LoginRequest loginRequest) {
        String id = trimOrNull(loginRequest.getIdentifier());
        String email = trimOrNull(loginRequest.getEmail());
        String identifier = id != null ? id : email;
        if (identifier == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username or email is required");
        }
        return identifier;
    }

    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public Optional<User> getUserByIdentifier(String identifier) {
        return userRepository.findByUsernameOrEmail(identifier);
    }
}
