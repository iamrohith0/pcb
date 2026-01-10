package com.pcbxpress.erp.modules.auth.service;

import com.pcbxpress.erp.modules.auth.model.Permission;
import com.pcbxpress.erp.modules.auth.model.UserRole;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing role-permission mappings
 * Defines which permissions each role should have
 */
@Service
public class RolePermissionService {
    
    // Role-permission mappings
    private final Map<UserRole, Set<Permission>> rolePermissions = new HashMap<>();
    
    public RolePermissionService() {
        initializeRolePermissions();
    }
    
    /**
     * Initialize role-permission mappings
     */
    private void initializeRolePermissions() {
        // ADMIN role - has all permissions
        rolePermissions.put(UserRole.ADMIN, new HashSet<>(Arrays.asList(Permission.values())));
        
        // SUPERVISOR role - has most permissions except system admin
        Set<Permission> supervisorPermissions = Arrays.stream(Permission.values())
            .filter(permission -> !permission.getCode().startsWith("system:admin"))
            .collect(Collectors.toSet());
        rolePermissions.put(UserRole.SUPERVISOR, supervisorPermissions);
        
        // USER role - has basic permissions for day-to-day operations
        Set<Permission> userPermissions = new HashSet<>();
        
        // Production permissions for users
        userPermissions.add(Permission.PRODUCTION_READ);
        userPermissions.add(Permission.PRODUCTION_WIP_VIEW);
        userPermissions.add(Permission.PRODUCTION_WIP_MOVE);
        userPermissions.add(Permission.PRODUCTION_CAPACITY_VIEW);
        userPermissions.add(Permission.PRODUCTION_ROUTING_VIEW);
        userPermissions.add(Permission.PRODUCTION_OPERATION_VIEW);
        
        // Inventory permissions for users
        userPermissions.add(Permission.INVENTORY_READ);
        userPermissions.add(Permission.INVENTORY_LOT_VIEW);
        userPermissions.add(Permission.INVENTORY_SERIAL_VIEW);
        userPermissions.add(Permission.INVENTORY_BOM_VIEW);
        
        // Sales permissions for users
        userPermissions.add(Permission.SALES_READ);
        userPermissions.add(Permission.SALES_CUSTOMER_VIEW);
        userPermissions.add(Permission.SALES_QUOTATION_VIEW);
        userPermissions.add(Permission.SALES_RFQ_VIEW);
        
        // Procurement permissions for users
        userPermissions.add(Permission.PROCUREMENT_READ);
        userPermissions.add(Permission.PROCUREMENT_SUPPLIER_VIEW);
        userPermissions.add(Permission.PROCUREMENT_GRN_VIEW);
        userPermissions.add(Permission.PROCUREMENT_PRICING_VIEW);
        
        // Quality permissions for users
        userPermissions.add(Permission.QUALITY_READ);
        userPermissions.add(Permission.QUALITY_INSPECTION_VIEW);
        userPermissions.add(Permission.QUALITY_NCR_VIEW);
        userPermissions.add(Permission.QUALITY_CAPA_VIEW);
        userPermissions.add(Permission.QUALITY_CERTIFICATE_VIEW);
        userPermissions.add(Permission.QUALITY_ATEST_VIEW);
        userPermissions.add(Permission.QUALITY_AOI_VIEW);
        
        // Warehouse permissions for users
        userPermissions.add(Permission.WAREHOUSE_READ);
        userPermissions.add(Permission.WAREHOUSE_LOCATION_VIEW);
        userPermissions.add(Permission.WAREHOUSE_WAREHOUSE_VIEW);
        
        // Engineering permissions for users
        userPermissions.add(Permission.ENGINEERING_READ);
        userPermissions.add(Permission.ENGINEERING_CAM_VIEW);
        userPermissions.add(Permission.ENGINEERING_DFM_VIEW);
        userPermissions.add(Permission.ENGINEERING_PANEL_VIEW);
        userPermissions.add(Permission.ENGINEERING_REVISION_VIEW);
        userPermissions.add(Permission.ENGINEERING_STACKUP_VIEW);
        userPermissions.add(Permission.ENGINEERING_MATERIAL_VIEW);
        
        // Maintenance permissions for users
        userPermissions.add(Permission.MAINTENANCE_READ);
        userPermissions.add(Permission.MAINTENANCE_BREAKDOWN_VIEW);
        userPermissions.add(Permission.MAINTENANCE_EQUIPMENT_VIEW);
        userPermissions.add(Permission.MAINTENANCE_PREVENTIVE_VIEW);
        userPermissions.add(Permission.MAINTENANCE_SPARES_VIEW);
        
        // Logistics permissions for users
        userPermissions.add(Permission.LOGISTICS_READ);
        userPermissions.add(Permission.LOGISTICS_DISPATCH_VIEW);
        userPermissions.add(Permission.LOGISTICS_SHIPMENT_VIEW);
        
        // Traceability permissions for users
        userPermissions.add(Permission.TRACEABILITY_READ);
        userPermissions.add(Permission.TRACEABILITY_BATCH_VIEW);
        userPermissions.add(Permission.TRACEABILITY_GENEALOGY_VIEW);
        userPermissions.add(Permission.TRACEABILITY_RECALL_VIEW);
        
        // Reports permissions for users
        userPermissions.add(Permission.REPORTS_READ);
        userPermissions.add(Permission.REPORTS_EXPORT);
        userPermissions.add(Permission.REPORTS_INVENTORY_VIEW);
        userPermissions.add(Permission.REPORTS_PRODUCTION_VIEW);
        userPermissions.add(Permission.REPORTS_SALES_VIEW);
        userPermissions.add(Permission.REPORTS_QUALITY_VIEW);
        userPermissions.add(Permission.REPORTS_PROCUREMENT_VIEW);
        userPermissions.add(Permission.REPORTS_WAREHOUSE_VIEW);
        userPermissions.add(Permission.REPORTS_ENGINEERING_VIEW);
        userPermissions.add(Permission.REPORTS_MAINTENANCE_VIEW);
        userPermissions.add(Permission.REPORTS_LOGISTICS_VIEW);
        userPermissions.add(Permission.REPORTS_TRACEABILITY_VIEW);
        
        // Settings permissions for users (read-only)
        userPermissions.add(Permission.SETTINGS_READ);
        userPermissions.add(Permission.SETTINGS_COMPANY_VIEW);
        userPermissions.add(Permission.SETTINGS_PLANTS_VIEW);
        userPermissions.add(Permission.SETTINGS_NUMBERING_VIEW);
        userPermissions.add(Permission.SETTINGS_INTEGRATIONS_VIEW);
        
        // Audit permissions for users (read-only)
        userPermissions.add(Permission.AUDIT_READ);
        
        rolePermissions.put(UserRole.USER, userPermissions);
    }
    
    /**
     * Get all permissions for a specific role
     */
    public Set<Permission> getPermissionsForRole(UserRole role) {
        return rolePermissions.getOrDefault(role, Collections.emptySet());
    }
    
    /**
     * Check if a role has a specific permission
     */
    public boolean hasPermission(UserRole role, Permission permission) {
        Set<Permission> permissions = rolePermissions.get(role);
        return permissions != null && permissions.contains(permission);
    }
    
    /**
     * Check if a role has any of the specified permissions
     */
    public boolean hasAnyPermission(UserRole role, Collection<Permission> permissions) {
        Set<Permission> rolePerms = rolePermissions.get(role);
        if (rolePerms == null) {
            return false;
        }
        return permissions.stream().anyMatch(rolePerms::contains);
    }
    
    /**
     * Check if a role has all of the specified permissions
     */
    public boolean hasAllPermissions(UserRole role, Collection<Permission> permissions) {
        Set<Permission> rolePerms = rolePermissions.get(role);
        if (rolePerms == null) {
            return false;
        }
        return permissions.stream().allMatch(rolePerms::contains);
    }
    
    /**
     * Get all permissions for a role by module
     */
    public Map<String, Set<Permission>> getPermissionsByModule(UserRole role) {
        Set<Permission> permissions = getPermissionsForRole(role);
        return permissions.stream()
            .collect(Collectors.groupingBy(
                Permission::getModule,
                Collectors.toSet()
            ));
    }
    
    /**
     * Get all permissions for a role that match a specific module
     */
    public Set<Permission> getPermissionsForModule(UserRole role, String module) {
        Set<Permission> permissions = getPermissionsForRole(role);
        return permissions.stream()
            .filter(permission -> permission.belongsToModule(module))
            .collect(Collectors.toSet());
    }
    
    /**
     * Get all available modules
     */
    public Set<String> getAvailableModules() {
        return Arrays.stream(Permission.values())
            .map(Permission::getModule)
            .collect(Collectors.toSet());
    }
    
    /**
     * Get all permissions for a module
     */
    public Set<Permission> getPermissionsForModule(String module) {
        return Arrays.stream(Permission.values())
            .filter(permission -> permission.belongsToModule(module))
            .collect(Collectors.toSet());
    }
    
    /**
     * Get role permissions summary
     */
    public Map<String, Object> getRolePermissionsSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        for (UserRole role : UserRole.values()) {
            Set<Permission> permissions = getPermissionsForRole(role);
            Map<String, Set<String>> byModule = permissions.stream()
                .collect(Collectors.groupingBy(
                    Permission::getModule,
                    Collectors.mapping(Permission::getCode, Collectors.toSet())
                ));
            
            summary.put(role.name(), Map.of(
                "totalPermissions", permissions.size(),
                "permissionsByModule", byModule
            ));
        }
        
        return summary;
    }
    
    /**
     * Add a permission to a role (for dynamic permission management)
     */
    public void addPermissionToRole(UserRole role, Permission permission) {
        rolePermissions.computeIfAbsent(role, k -> new HashSet<>()).add(permission);
    }
    
    /**
     * Remove a permission from a role (for dynamic permission management)
     */
    public void removePermissionFromRole(UserRole role, Permission permission) {
        Set<Permission> permissions = rolePermissions.get(role);
        if (permissions != null) {
            permissions.remove(permission);
        }
    }
    
    /**
     * Reset role permissions to default (for role management)
     */
    public void resetRolePermissions(UserRole role) {
        // Remove and reinitialize
        rolePermissions.remove(role);
        initializeRolePermissions();
    }
}