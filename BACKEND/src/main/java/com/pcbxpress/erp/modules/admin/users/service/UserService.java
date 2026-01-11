package com.pcbxpress.erp.modules.admin.users.service;

import com.pcbxpress.erp.modules.admin.users.dto.UserDto;
import com.pcbxpress.erp.modules.admin.users.dto.UserPayload;
import com.pcbxpress.erp.modules.admin.users.model.User;
import com.pcbxpress.erp.modules.admin.users.repository.AdminUserRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing Admin Users
 */
@Service
@Transactional
public class UserService {
    
    private final AdminUserRepository userRepository;
    
    public UserService(AdminUserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    /**
     * List users with optional filters
     */
    public List<UserDto> list(String query, User.Role role, String status) {
        return userRepository.findByCriteria(role, status, query).stream()
            .sorted((u1, u2) -> {
                // Sort by last login (recent first), then by name
                OffsetDateTime t1 = u1.getLastLoginAt() != null ? u1.getLastLoginAt() : OffsetDateTime.MIN;
                OffsetDateTime t2 = u2.getLastLoginAt() != null ? u2.getLastLoginAt() : OffsetDateTime.MIN;
                int timeCompare = t2.compareTo(t1); // Descending order
                if (timeCompare != 0) return timeCompare;
                return u1.getName().compareToIgnoreCase(u2.getName());
            })
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single user by ID
     */
    public UserDto get(String id) {
        User user = userRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("User not found: " + id));
        return toDto(user);
    }
    
    /**
     * Create a new user
     */
    public UserDto create(UserPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        User user = new User();
        user.setId(UUID.randomUUID());
        applyPayload(user, payload);
        
        // Set default values
        if (user.isActive() == false) {
            user.setActive(true);
        }
        if (user.getFailedLoginAttempts() == null) {
            user.setFailedLoginAttempts(0);
        }
        if (user.isTwoFactorEnabled() == false) {
            user.setTwoFactorEnabled(false);
        }
        
        User saved = userRepository.save(user);
        return toDto(saved);
    }
    
    /**
     * Update an existing user
     */
    public UserDto update(String id, UserPayload payload) {
        User existing = userRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("User not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        User saved = userRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a user
     */
    public void delete(String id) {
        userRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple users
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(UserService::parseId).collect(Collectors.toList());
        userRepository.deleteAllById(uuidList);
    }
    
    /**
     * Toggle user active status
     */
    public UserDto toggleStatus(String id) {
        User user = userRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("User not found: " + id));
        
        user.setActive(!user.isActive());
        User saved = userRepository.save(user);
        return toDto(saved);
    }
    
    /**
     * Search users by query
     */
    public List<UserDto> search(String query) {
        return userRepository.findByCriteria(null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get user statistics
     */
    public Map<String, Object> getStats() {
        List<User> all = userRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(User::isActive).count();
        long inactive = all.stream().filter(user -> !user.isActive()).count();
        
        // Count by role
        Map<User.Role, Long> byRole = all.stream()
            .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));
        
        // Count by department
        Map<String, Long> byDepartment = all.stream()
            .filter(user -> user.getDepartment() != null)
            .collect(Collectors.groupingBy(User::getDepartment, Collectors.counting()));
        
        // Active users by role
        Map<User.Role, Long> activeByRole = all.stream()
            .filter(User::isActive)
            .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));
        
        return Map.of(
            "total", total,
            "active", active,
            "inactive", inactive,
            "byRole", byRole,
            "byDepartment", byDepartment,
            "activeByRole", activeByRole
        );
    }
    
    /**
     * Export users to CSV format
     */
    public String exportCsv(List<UserDto> data) {
        String header = "Username,Name,Email,Employee Code,Role,Department,Status,Phone,Last Login,Notes";
        String rows = data.stream()
            .map(user -> String.join(",",
                safe(user.username()),
                safe(user.name()),
                safe(user.email()),
                safe(user.employeeCode()),
                safe(user.role() != null ? user.role().toString() : ""),
                safe(user.department()),
                user.isActive() ? "Active" : "Inactive",
                safe(user.phone()),
                user.lastLoginAt() != null ? user.lastLoginAt().toString() : "",
                safe(user.notes())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("User not found: " + id);
        }
    }
    
    private void validateUniqueConstraints(UserPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate username
        if (payload.username() != null && !payload.username().isBlank()) {
            boolean exists = userRepository.existsByUsernameIgnoreCaseAndIdNot(payload.username(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Username already exists: " + payload.username());
            }
        }
        
        // Check for duplicate email
        if (payload.email() != null && !payload.email().isBlank()) {
            boolean exists = userRepository.existsByEmailIgnoreCaseAndIdNot(payload.email(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Email already exists: " + payload.email());
            }
        }
        
        // Check for duplicate employee code
        if (payload.employeeCode() != null && !payload.employeeCode().isBlank()) {
            boolean exists = userRepository.existsByEmployeeCodeAndIdNot(payload.employeeCode(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Employee code already exists: " + payload.employeeCode());
            }
        }
    }
    
    private void applyPayload(User target, UserPayload payload) {
        target.setUsername(payload.username());
        target.setName(payload.name());
        target.setEmail(payload.email());
        target.setEmployeeCode(payload.employeeCode());
        target.setRole(payload.role());
        target.setDepartment(payload.department());
        target.setActive(payload.isActive());
        target.setPhone(payload.phone());
        target.setNotes(payload.notes());
    }
    
    private UserDto toDto(User user) {
        return new UserDto(
            user.getId().toString(),
            user.getUsername(),
            user.getName(),
            user.getEmail(),
            user.getEmployeeCode(),
            user.getRole(),
            user.getDepartment(),
            user.isActive(),
            user.getPhone(),
            safeOffset(user.getCreatedAt()),
            safeOffset(user.getUpdatedAt()),
            safeOffset(user.getLastLoginAt()),
            user.getNotes()
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}