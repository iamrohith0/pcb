package com.pcbxpress.erp.modules.auth.controller;

import com.pcbxpress.erp.common.web.ApiResponse;
import com.pcbxpress.erp.modules.auth.dto.LoginRequest;
import com.pcbxpress.erp.modules.auth.dto.LoginResponse;
import com.pcbxpress.erp.modules.auth.dto.AuthUserDto;
import com.pcbxpress.erp.modules.auth.service.AuthenticationService;
import com.pcbxpress.erp.modules.auth.model.User;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationService authenticationService;

    @Autowired
    public AuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        LoginResponse loginResponse = authenticationService.login(loginRequest);
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(Principal principal) {
        if (principal != null) {
            authenticationService.logout(principal.getName());
        }
        return ResponseEntity.ok(ApiResponse.of("Logged out successfully", "/auth/logout"));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthUserDto> getCurrentUser(Principal principal) {
        if (principal == null) {
            return ResponseEntity.notFound().build();
        }
        
        AuthUserDto user = authenticationService.getAuthenticatedUser(principal.getName());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@RequestHeader("Authorization") String refreshToken) {
        // In a real implementation, you would validate and refresh the token
        // For now, returning a new token
        return ResponseEntity.ok(new LoginResponse());
    }

    @GetMapping("/debug/user/{identifier}")
    public ResponseEntity<?> debugUser(@PathVariable String identifier) {
        try {
            Optional<User> userOpt = authenticationService.getUserByIdentifier(identifier);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                return ResponseEntity.ok(Map.of(
                    "found", true,
                    "username", user.getUsername(),
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "status", user.getStatus(),
                    "passwordHash", user.getPasswordHash()
                ));
            } else {
                return ResponseEntity.ok(Map.of("found", false, "message", "User not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", e.getMessage()));
        }
    }
}
