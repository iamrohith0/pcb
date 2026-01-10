package com.pcbxpress.erp.modules.admin.permissions.service;

import com.pcbxpress.erp.modules.admin.permissions.dto.PermissionDto;
import com.pcbxpress.erp.modules.admin.permissions.dto.PermissionPayload;
import com.pcbxpress.erp.modules.admin.permissions.model.Permission;
import com.pcbxpress.erp.modules.admin.permissions.repository.PermissionRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing Permissions
 */
@Service
@Transactional
public class PermissionService {
    
    private final PermissionRepository permissionRepository;
    
    public PermissionService(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }
    
    /**
     * List permissions with optional filters
     */
    @Cacheable(value = "permissions", key = "#root.methodName + '_' + #query + '_' + #module + '_' + #permissionType + '_' + #isSystem + '_' + #isActive")
    public List<PermissionDto> list(String query, String module, Permission.PermissionType permissionType, 
                                   Boolean isSystem, Boolean isActive) {
        return permissionRepository.findByCriteria(module, permissionType, isSystem, isActive, query).stream()
            .sorted(Comparator.comparing(Permission::getDisplayOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Permission::getName))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single permission by ID
     */
    @Cacheable(value = "permissions", key = "#root.methodName + '_' + #id")
    public PermissionDto get(String id) {
        Permission permission = permissionRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Permission not found: " + id));
        return toDto(permission);
    }
    
    /**
     * Create a new permission
     */
    @CacheEvict(value = "permissions", allEntries = true)
    public PermissionDto create(PermissionPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        // Validate system permissions cannot be created via API
        if (payload.isSystem()) {
            throw new IllegalArgumentException("System permissions cannot be created via API");
        }
        
        Permission permission = new Permission();
        permission.setId(UUID.randomUUID());
        applyPayload(permission, payload);
        
        // Set default values
        if (permission.isActive() == false) {
            permission.setActive(true);
        }
        if (permission.isSystem() == false) {
            permission.setSystem(false);
        }
        
        Permission saved = permissionRepository.save(permission);
        return toDto(saved);
    }
    
    /**
     * Update an existing permission
     */
    @CacheEvict(value = "permissions", allEntries = true)
    public PermissionDto update(String id, PermissionPayload payload) {
        Permission existing = permissionRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Permission not found: " + id));
        
        // Validate system permissions cannot be modified
        if (existing.isSystem()) {
            throw new IllegalArgumentException("System permissions cannot be modified");
        }
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Permission saved = permissionRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a permission
     */
    @CacheEvict(value = "permissions", allEntries = true)
    public void delete(String id) {
        Permission permission = permissionRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Permission not found: " + id));
        
        // Prevent deletion of system permissions
        if (permission.isSystem()) {
            throw new IllegalArgumentException("System permissions cannot be deleted");
        }
        
        permissionRepository.deleteById(permission.getId());
    }
    
    /**
     * Delete multiple permissions
     */
    @CacheEvict(value = "permissions", allEntries = true)
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(PermissionService::parseId).collect(Collectors.toList());
        List<Permission> permissions = permissionRepository.findAllById(uuidList);
        
        // Check for system permissions
        boolean hasSystemPermissions = permissions.stream().anyMatch(Permission::isSystem);
        if (hasSystemPermissions) {
            throw new IllegalArgumentException("Cannot delete system permissions");
        }
        
        permissionRepository.deleteAllById(uuidList);
    }
    
    /**
     * Toggle permission active status
     */
    @CacheEvict(value = "permissions", allEntries = true)
    public PermissionDto toggleStatus(String id) {
        Permission permission = permissionRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Permission not found: " + id));
        
        // Prevent toggling system permissions
        if (permission.isSystem()) {
            throw new IllegalArgumentException("Cannot toggle system permissions");
        }
        
        permission.setActive(!permission.isActive());
        Permission saved = permissionRepository.save(permission);
        return toDto(saved);
    }
    
    /**
     * Search permissions by query
     */
    @Cacheable(value = "permissions", key = "#root.methodName + '_' + #query")
    public List<PermissionDto> search(String query) {
        return permissionRepository.findByCriteria(null, null, null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get permissions by module
     */
    @Cacheable(value = "permissions", key = "#root.methodName + '_' + #module")
    public List<PermissionDto> getByModule(String module) {
        return permissionRepository.findByModuleIgnoreCaseOrderByDisplayOrder(module).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get active permissions by module
     */
    @Cacheable(value = "permissions", key = "#root.methodName + '_' + #module")
    public List<PermissionDto> getActiveByModule(String module) {
        return permissionRepository.findByModuleIgnoreCaseAndIsActiveTrueOrderByDisplayOrder(module).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get system permissions
     */
    @Cacheable(value = "permissions", key = "#root.methodName")
    public List<PermissionDto> getSystemPermissions() {
        return permissionRepository.findByIsSystemTrue().stream()
            .sorted(Comparator.comparing(Permission::getModule)
                .thenComparing(Permission::getName))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get custom permissions
     */
    @Cacheable(value = "permissions", key = "#root.methodName")
    public List<PermissionDto> getCustomPermissions() {
        return permissionRepository.findByIsSystemFalse().stream()
            .sorted(Comparator.comparing(Permission::getModule)
                .thenComparing(Permission::getName))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get all modules
     */
    @Cacheable(value = "permissions", key = "#root.methodName")
    public List<String> getAllModules() {
        return permissionRepository.findAllModules();
    }
    
    /**
     * Get all operations
     */
    @Cacheable(value = "permissions", key = "#root.methodName")
    public List<String> getAllOperations() {
        return permissionRepository.findAllOperations();
    }
    
    /**
     * Get permission statistics
     */
    @Cacheable(value = "permissions", key = "#root.methodName")
    public Map<String, Object> getStats() {
        List<Permission> all = permissionRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(Permission::isActive).count();
        long inactive = all.stream().filter(permission -> !permission.isActive()).count();
        long system = all.stream().filter(Permission::isSystem).count();
        long custom = all.stream().filter(permission -> !permission.isSystem()).count();
        
        // Count by module
        Map<String, Long> byModule = all.stream()
            .filter(permission -> permission.getModule() != null)
            .collect(Collectors.groupingBy(Permission::getModule, Collectors.counting()));
        
        // Count by permission type
        Map<Permission.PermissionType, Long> byType = all.stream()
            .collect(Collectors.groupingBy(Permission::getPermissionType, Collectors.counting()));
        
        // Active permissions by module
        Map<String, Long> activeByModule = all.stream()
            .filter(Permission::isActive)
            .filter(permission -> permission.getModule() != null)
            .collect(Collectors.groupingBy(Permission::getModule, Collectors.counting()));
        
        // System permissions by module
        Map<String, Long> systemByModule = all.stream()
            .filter(Permission::isSystem)
            .filter(permission -> permission.getModule() != null)
            .collect(Collectors.groupingBy(Permission::getModule, Collectors.counting()));
        
        return Map.of(
            "total", total,
            "active", active,
            "inactive", inactive,
            "system", system,
            "custom", custom,
            "byModule", byModule,
            "byType", byType,
            "activeByModule", activeByModule,
            "systemByModule", systemByModule
        );
    }
    
    /**
     * Export permissions to CSV format
     */
    public String exportCsv(List<PermissionDto> data) {
        String header = "Code,Name,Description,Module,Operation,Type,System,Active,Display Order,Created At,Updated At";
        String rows = data.stream()
            .map(permission -> String.join(",",
                safe(permission.code()),
                safe(permission.name()),
                safe(permission.description()),
                safe(permission.module()),
                safe(permission.operation()),
                safe(permission.permissionType() != null ? permission.permissionType().toString() : ""),
                permission.isSystem() ? "Yes" : "No",
                permission.isActive() ? "Yes" : "No",
                safe(permission.displayOrder() != null ? permission.displayOrder().toString() : ""),
                safe(permission.createdAt() != null ? permission.createdAt().toString() : ""),
                safe(permission.updatedAt() != null ? permission.updatedAt().toString() : "")
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Permission not found: " + id);
        }
    }
    
    private void validateUniqueConstraints(PermissionPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate code
        if (payload.code() != null && !payload.code().isBlank()) {
            boolean exists = permissionRepository.existsByCodeIgnoreCaseAndIdNot(payload.code(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Permission code already exists: " + payload.code());
            }
        }
    }
    
    private void applyPayload(Permission target, PermissionPayload payload) {
        target.setCode(payload.code());
        target.setName(payload.name());
        target.setDescription(payload.description());
        target.setModule(payload.module());
        target.setOperation(payload.operation());
        target.setSystem(payload.isSystem());
        target.setActive(payload.isActive());
        target.setPermissionType(payload.permissionType());
        target.setDisplayOrder(payload.displayOrder());
        target.setNotes(payload.notes());
    }
    
    private PermissionDto toDto(Permission permission) {
        return new PermissionDto(
            permission.getId().toString(),
            permission.getCode(),
            permission.getName(),
            permission.getDescription(),
            permission.getModule(),
            permission.getOperation(),
            permission.isSystem(),
            permission.isActive(),
            permission.getPermissionType(),
            permission.getDisplayOrder(),
            safeOffset(permission.getCreatedAt()),
            safeOffset(permission.getUpdatedAt()),
            permission.getCreatedBy(),
            permission.getUpdatedBy(),
            permission.getNotes()
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}