package com.pcbxpress.erp.modules.admin.permissions.service;

import com.pcbxpress.erp.modules.admin.permissions.model.Permission;
import com.pcbxpress.erp.modules.admin.permissions.repository.PermissionRepository;
import com.pcbxpress.erp.modules.auth.model.UserRole;
import com.pcbxpress.erp.modules.auth.service.RolePermissionService;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bridge service that integrates dynamic permissions with the existing enum-based permission system
 * This service allows the system to work with both static enum permissions and dynamic database permissions
 */
@Service
@Transactional(readOnly = true)
public class PermissionBridgeService {
    
    private final PermissionRepository permissionRepository;
    private final RolePermissionService rolePermissionService;
    
    public PermissionBridgeService(PermissionRepository permissionRepository, 
                                  RolePermissionService rolePermissionService) {
        this.permissionRepository = permissionRepository;
        this.rolePermissionService = rolePermissionService;
    }
    
    /**
     * Get all permissions (both static enum and dynamic database permissions) for a role
     */
    @Cacheable(value = "role_permissions", key = "#role")
    public Set<com.pcbxpress.erp.modules.auth.model.Permission> getAllPermissionsForRole(UserRole role) {
        Set<com.pcbxpress.erp.modules.auth.model.Permission> permissions = new HashSet<>();
        
        // Add static enum permissions based on role
        permissions.addAll(rolePermissionService.getPermissionsForRole(role));
        
        // Add dynamic permissions for the role
        Set<Permission> dynamicPermissions = getActiveDynamicPermissionsForRole(role);
        for (Permission dynamicPermission : dynamicPermissions) {
            // Convert dynamic permission to enum if it matches an existing enum
            com.pcbxpress.erp.modules.auth.model.Permission enumPermission = getMatchingEnumPermission(dynamicPermission.getCode());
            if (enumPermission != null) {
                permissions.add(enumPermission);
            }
        }
        
        return permissions;
    }
    
    /**
     * Check if a role has a specific permission (supports both static and dynamic permissions)
     */
    public boolean hasPermission(UserRole role, com.pcbxpress.erp.modules.auth.model.Permission permission) {
        // Check static permissions first
        if (rolePermissionService.hasPermission(role, permission)) {
            return true;
        }
        
        // Check dynamic permissions
        Set<Permission> dynamicPermissions = getActiveDynamicPermissionsForRole(role);
        return dynamicPermissions.stream()
            .anyMatch(dp -> dp.getCode().equalsIgnoreCase(permission.getCode()));
    }
    
    /**
     * Check if a role has any of the specified permissions
     */
    public boolean hasAnyPermission(UserRole role, Set<com.pcbxpress.erp.modules.auth.model.Permission> permissions) {
        for (com.pcbxpress.erp.modules.auth.model.Permission permission : permissions) {
            if (hasPermission(role, permission)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Check if a role has all of the specified permissions
     */
    public boolean hasAllPermissions(UserRole role, Set<com.pcbxpress.erp.modules.auth.model.Permission> permissions) {
        for (com.pcbxpress.erp.modules.auth.model.Permission permission : permissions) {
            if (!hasPermission(role, permission)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Get permissions by module for a role (supports both static and dynamic)
     */
    public Set<com.pcbxpress.erp.modules.auth.model.Permission> getPermissionsForModule(UserRole role, String module) {
        Set<com.pcbxpress.erp.modules.auth.model.Permission> allPermissions = getAllPermissionsForRole(role);
        return allPermissions.stream()
            .filter(permission -> permission.belongsToModule(module))
            .collect(Collectors.toSet());
    }
    
    /**
     * Get permission summary for a role including both static and dynamic permissions
     */
    public Map<String, Object> getPermissionSummary(UserRole role) {
        Set<com.pcbxpress.erp.modules.auth.model.Permission> allPermissions = getAllPermissionsForRole(role);
        
        // Group by module
        Map<String, Set<String>> byModule = allPermissions.stream()
            .collect(Collectors.groupingBy(
                com.pcbxpress.erp.modules.auth.model.Permission::getModule,
                Collectors.mapping(com.pcbxpress.erp.modules.auth.model.Permission::getCode, Collectors.toSet())
            ));
        
        // Count permissions
        long total = allPermissions.size();
        long staticCount = rolePermissionService.getPermissionsForRole(role).size();
        long dynamicCount = total - staticCount;
        
        return Map.of(
            "role", role.name(),
            "totalPermissions", total,
            "staticPermissions", staticCount,
            "dynamicPermissions", dynamicCount,
            "permissionsByModule", byModule,
            "modules", byModule.keySet()
        );
    }
    
    /**
     * Get active dynamic permissions for a role
     * This would typically be implemented with a role-permission mapping table
     * For now, we'll return all active dynamic permissions as an example
     */
    private Set<Permission> getActiveDynamicPermissionsForRole(UserRole role) {
        // In a real implementation, this would query a role_permission_mapping table
        // For now, we'll return all active permissions as an example
        List<Permission> activePermissions = permissionRepository.findByIsActiveTrue();
        
        // Filter by role-specific logic if needed
        // For example, certain roles might only have access to certain modules
        return new HashSet<>(activePermissions);
    }
    
    /**
     * Find matching enum permission for a dynamic permission code
     */
    private com.pcbxpress.erp.modules.auth.model.Permission getMatchingEnumPermission(String code) {
        for (com.pcbxpress.erp.modules.auth.model.Permission permission : com.pcbxpress.erp.modules.auth.model.Permission.values()) {
            if (permission.getCode().equalsIgnoreCase(code)) {
                return permission;
            }
        }
        return null;
    }
    
    /**
     * Refresh permission cache for a role
     */
    @CacheEvict(value = "role_permissions", key = "#role")
    public void refreshPermissionCache(UserRole role) {
        // Cache will be refreshed on next access
    }
    
    /**
     * Refresh all permission caches
     */
    @CacheEvict(value = "role_permissions", allEntries = true)
    public void refreshAllPermissionCaches() {
        // All caches will be refreshed on next access
    }
    
    /**
     * Validate that a dynamic permission code doesn't conflict with static permissions
     */
    public boolean isValidDynamicPermissionCode(String code) {
        // Check if the code conflicts with any static permission
        for (com.pcbxpress.erp.modules.auth.model.Permission permission : com.pcbxpress.erp.modules.auth.model.Permission.values()) {
            if (permission.getCode().equalsIgnoreCase(code)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Get all available permission codes (both static and dynamic)
     */
    public Set<String> getAllAvailablePermissionCodes() {
        Set<String> codes = new HashSet<>();
        
        // Add static permission codes
        for (com.pcbxpress.erp.modules.auth.model.Permission permission : com.pcbxpress.erp.modules.auth.model.Permission.values()) {
            codes.add(permission.getCode());
        }
        
        // Add dynamic permission codes
        List<Permission> dynamicPermissions = permissionRepository.findByIsActiveTrue();
        for (Permission permission : dynamicPermissions) {
            codes.add(permission.getCode());
        }
        
        return codes;
    }
    
    /**
     * Get permission code suggestions for a module
     */
    public List<String> getSuggestedPermissionCodes(String module) {
        // Get existing codes for the module
        Set<String> existingCodes = getAllAvailablePermissionCodes();
        
        // Generate suggestions based on common patterns
        return List.of(
            module + ":view",
            module + ":create", 
            module + ":update",
            module + ":delete",
            module + ":manage",
            module + ":export"
        ).stream()
            .filter(code -> !existingCodes.contains(code))
            .collect(Collectors.toList());
    }
    
    /**
     * Check if a permission code is reserved (static enum)
     */
    public boolean isReservedPermissionCode(String code) {
        return !isValidDynamicPermissionCode(code);
    }
    
    /**
     * Get system permission statistics including both static and dynamic
     */
    public Map<String, Object> getSystemPermissionStats() {
        // Static permissions stats
        Map<String, Long> staticByModule = new HashMap<>();
        for (com.pcbxpress.erp.modules.auth.model.Permission permission : com.pcbxpress.erp.modules.auth.model.Permission.values()) {
            String module = permission.getModule();
            staticByModule.put(module, staticByModule.getOrDefault(module, 0L) + 1L);
        }
        
        // Dynamic permissions stats
        Map<String, Long> dynamicStats = permissionRepository.findAll().stream()
            .collect(Collectors.groupingBy(
                Permission::getModule,
                Collectors.counting()
            ));
        
        return Map.of(
            "staticPermissions", com.pcbxpress.erp.modules.auth.model.Permission.values().length,
            "staticByModule", staticByModule,
            "dynamicPermissions", dynamicStats,
            "totalPermissions", com.pcbxpress.erp.modules.auth.model.Permission.values().length + permissionRepository.count()
        );
    }
}