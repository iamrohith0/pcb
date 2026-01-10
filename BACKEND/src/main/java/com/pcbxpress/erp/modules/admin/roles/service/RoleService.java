package com.pcbxpress.erp.modules.admin.roles.service;

import com.pcbxpress.erp.modules.admin.roles.dto.RoleDto;
import com.pcbxpress.erp.modules.admin.roles.dto.RolePayload;
import com.pcbxpress.erp.modules.admin.roles.model.Role;
import com.pcbxpress.erp.modules.admin.roles.repository.RoleRepository;
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
 * Service for managing Admin Roles
 */
@Service
@Transactional
public class RoleService {
    
    private final RoleRepository roleRepository;
    
    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }
    
    /**
     * List roles with optional filters
     */
    public List<RoleDto> list(String query, Role.RoleType roleType, String status) {
        return roleRepository.findByCriteria(roleType, status, query).stream()
            .sorted((r1, r2) -> {
                // Sort by name, then by created date
                int nameCompare = r1.getName().compareToIgnoreCase(r2.getName());
                if (nameCompare != 0) return nameCompare;
                return r1.getCreatedAt().compareTo(r2.getCreatedAt());
            })
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single role by ID
     */
    public RoleDto get(String id) {
        Role role = roleRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Role not found: " + id));
        return toDto(role);
    }
    
    /**
     * Create a new role
     */
    public RoleDto create(RolePayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Role role = new Role();
        role.setId(UUID.randomUUID());
        applyPayload(role, payload);
        
        // Set default values
        if (role.isActive() == false) {
            role.setActive(true);
        }
        
        Role saved = roleRepository.save(role);
        return toDto(saved);
    }
    
    /**
     * Update an existing role
     */
    public RoleDto update(String id, RolePayload payload) {
        Role existing = roleRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Role not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Role saved = roleRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a role
     */
    public void delete(String id) {
        roleRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple roles
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(RoleService::parseId).collect(Collectors.toList());
        roleRepository.deleteAllById(uuidList);
    }
    
    /**
     * Toggle role active status
     */
    public RoleDto toggleStatus(String id) {
        Role role = roleRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Role not found: " + id));
        
        role.setActive(!role.isActive());
        Role saved = roleRepository.save(role);
        return toDto(saved);
    }
    
    /**
     * Search roles by query
     */
    public List<RoleDto> search(String query) {
        return roleRepository.findByCriteria(null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get role statistics
     */
    public Map<String, Object> getStats() {
        List<Role> all = roleRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(Role::isActive).count();
        long inactive = all.stream().filter(role -> !role.isActive()).count();
        
        // Count by role type
        Map<Role.RoleType, Long> byType = all.stream()
            .collect(Collectors.groupingBy(Role::getRoleType, Collectors.counting()));
        
        // Count by department
        Map<String, Long> byDepartment = all.stream()
            .filter(role -> role.getDepartment() != null)
            .collect(Collectors.groupingBy(Role::getDepartment, Collectors.counting()));
        
        // Active roles by type
        Map<Role.RoleType, Long> activeByType = all.stream()
            .filter(Role::isActive)
            .collect(Collectors.groupingBy(Role::getRoleType, Collectors.counting()));
        
        return Map.of(
            "total", total,
            "active", active,
            "inactive", inactive,
            "byType", byType,
            "byDepartment", byDepartment,
            "activeByType", activeByType
        );
    }
    
    /**
     * Export roles to CSV format
     */
    public String exportCsv(List<RoleDto> data) {
        String header = "Role Key,Name,Description,Status,Type,Department,Created By,Updated By,Notes";
        String rows = data.stream()
            .map(role -> String.join(",",
                safe(role.roleKey()),
                safe(role.name()),
                safe(role.description()),
                role.isActive() ? "Active" : "Inactive",
                safe(role.roleType() != null ? role.roleType().toString() : ""),
                safe(role.department()),
                safe(role.createdBy()),
                safe(role.updatedBy()),
                safe(role.notes())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Role not found: " + id);
        }
    }
    
    private void validateUniqueConstraints(RolePayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate role key
        if (payload.roleKey() != null && !payload.roleKey().isBlank()) {
            boolean exists = roleRepository.existsByRoleKeyIgnoreCaseAndIdNot(payload.roleKey(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Role key already exists: " + payload.roleKey());
            }
        }
        
        // Check for duplicate name
        if (payload.name() != null && !payload.name().isBlank()) {
            boolean exists = roleRepository.existsByNameIgnoreCaseAndIdNot(payload.name(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Role name already exists: " + payload.name());
            }
        }
    }
    
    private void applyPayload(Role target, RolePayload payload) {
        target.setRoleKey(payload.roleKey());
        target.setName(payload.name());
        target.setDescription(payload.description());
        target.setActive(payload.isActive());
        target.setRoleType(payload.roleType());
        target.setDepartment(payload.department());
        target.setNotes(payload.notes());
    }
    
    private RoleDto toDto(Role role) {
        return new RoleDto(
            role.getId().toString(),
            role.getRoleKey(),
            role.getName(),
            role.getDescription(),
            role.isActive(),
            role.getRoleType(),
            role.getDepartment(),
            safeOffset(role.getCreatedAt()),
            safeOffset(role.getUpdatedAt()),
            role.getCreatedBy(),
            role.getUpdatedBy(),
            role.getNotes()
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}