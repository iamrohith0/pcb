package com.pcbxpress.erp.modules.production.service;

import com.pcbxpress.erp.modules.auth.model.Permission;
import com.pcbxpress.erp.modules.auth.model.UserRole;
import com.pcbxpress.erp.modules.auth.service.RolePermissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Set;

/**
 * Production-specific permission service
 * Handles permission checking for production operations
 */
@Service
public class ProductionPermissionService {
    
    private final RolePermissionService rolePermissionService;
    
    @Autowired
    public ProductionPermissionService(RolePermissionService rolePermissionService) {
        this.rolePermissionService = rolePermissionService;
    }
    
    /**
     * Check if a user role has permission to view work orders
     */
    public boolean canViewWorkOrders(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_READ);
    }
    
    /**
     * Check if a user role has permission to create work orders
     */
    public boolean canCreateWorkOrders(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_CREATE);
    }
    
    /**
     * Check if a user role has permission to update work orders
     */
    public boolean canUpdateWorkOrders(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_UPDATE);
    }
    
    /**
     * Check if a user role has permission to delete work orders
     */
    public boolean canDeleteWorkOrders(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_DELETE);
    }
    
    /**
     * Check if a user role has permission to release work orders
     */
    public boolean canReleaseWorkOrders(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_RELEASE);
    }
    
    /**
     * Check if a user role has permission to complete work orders
     */
    public boolean canCompleteWorkOrders(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_COMPLETE);
    }
    
    /**
     * Check if a user role has permission to cancel work orders
     */
    public boolean canCancelWorkOrders(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_CANCEL);
    }
    
    /**
     * Check if a user role has permission to hold work orders
     */
    public boolean canHoldWorkOrders(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_HOLD);
    }
    
    /**
     * Check if a user role has permission to resume work orders
     */
    public boolean canResumeWorkOrders(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_RESUME);
    }
    
    /**
     * Check if a user role has permission to schedule production
     */
    public boolean canScheduleProduction(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_SCHEDULE);
    }
    
    /**
     * Check if a user role has permission to view capacity
     */
    public boolean canViewCapacity(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_CAPACITY_VIEW);
    }
    
    /**
     * Check if a user role has permission to manage capacity
     */
    public boolean canManageCapacity(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_CAPACITY_MANAGE);
    }
    
    /**
     * Check if a user role has permission to view routing
     */
    public boolean canViewRouting(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_ROUTING_VIEW);
    }
    
    /**
     * Check if a user role has permission to create routing
     */
    public boolean canCreateRouting(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_ROUTING_CREATE);
    }
    
    /**
     * Check if a user role has permission to update routing
     */
    public boolean canUpdateRouting(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_ROUTING_UPDATE);
    }
    
    /**
     * Check if a user role has permission to delete routing
     */
    public boolean canDeleteRouting(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_ROUTING_DELETE);
    }
    
    /**
     * Check if a user role has permission to view operations
     */
    public boolean canViewOperations(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_OPERATION_VIEW);
    }
    
    /**
     * Check if a user role has permission to create operations
     */
    public boolean canCreateOperations(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_OPERATION_CREATE);
    }
    
    /**
     * Check if a user role has permission to update operations
     */
    public boolean canUpdateOperations(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_OPERATION_UPDATE);
    }
    
    /**
     * Check if a user role has permission to delete operations
     */
    public boolean canDeleteOperations(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_OPERATION_DELETE);
    }
    
    /**
     * Check if a user role has permission to view WIP
     */
    public boolean canViewWIP(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_WIP_VIEW);
    }
    
    /**
     * Check if a user role has permission to move WIP
     */
    public boolean canMoveWIP(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_WIP_MOVE);
    }
    
    /**
     * Check if a user role has permission to hold WIP
     */
    public boolean canHoldWIP(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_WIP_HOLD);
    }
    
    /**
     * Check if a user role has permission to release WIP
     */
    public boolean canReleaseWIP(UserRole role) {
        return rolePermissionService.hasPermission(role, Permission.PRODUCTION_WIP_RELEASE);
    }
    
    /**
     * Check if a user role has permission for any work order operation
     */
    public boolean canPerformWorkOrderOperation(UserRole role) {
        return rolePermissionService.hasAnyPermission(role, Set.of(
            Permission.PRODUCTION_CREATE,
            Permission.PRODUCTION_UPDATE,
            Permission.PRODUCTION_DELETE,
            Permission.PRODUCTION_RELEASE,
            Permission.PRODUCTION_COMPLETE,
            Permission.PRODUCTION_CANCEL,
            Permission.PRODUCTION_HOLD,
            Permission.PRODUCTION_RESUME
        ));
    }
    
    /**
     * Check if a user role has permission for any routing operation
     */
    public boolean canPerformRoutingOperation(UserRole role) {
        return rolePermissionService.hasAnyPermission(role, Set.of(
            Permission.PRODUCTION_ROUTING_CREATE,
            Permission.PRODUCTION_ROUTING_UPDATE,
            Permission.PRODUCTION_ROUTING_DELETE
        ));
    }
    
    /**
     * Check if a user role has permission for any WIP operation
     */
    public boolean canPerformWIPOperation(UserRole role) {
        return rolePermissionService.hasAnyPermission(role, Set.of(
            Permission.PRODUCTION_WIP_MOVE,
            Permission.PRODUCTION_WIP_HOLD,
            Permission.PRODUCTION_WIP_RELEASE
        ));
    }
    
    /**
     * Check if a user role has permission for any capacity operation
     */
    public boolean canPerformCapacityOperation(UserRole role) {
        return rolePermissionService.hasAnyPermission(role, Set.of(
            Permission.PRODUCTION_CAPACITY_VIEW,
            Permission.PRODUCTION_CAPACITY_MANAGE
        ));
    }
    
    /**
     * Check if a user role has permission for any operation management
     */
    public boolean canPerformOperationManagement(UserRole role) {
        return rolePermissionService.hasAnyPermission(role, Set.of(
            Permission.PRODUCTION_OPERATION_CREATE,
            Permission.PRODUCTION_OPERATION_UPDATE,
            Permission.PRODUCTION_OPERATION_DELETE
        ));
    }
    
    /**
     * Get all production permissions for a role
     */
    public Set<Permission> getProductionPermissionsForRole(UserRole role) {
        return rolePermissionService.getPermissionsForModule(role, "production");
    }
    
    /**
     * Check if a role has all required permissions for a specific operation
     */
    public boolean hasAllRequiredPermissions(UserRole role, Set<Permission> requiredPermissions) {
        return rolePermissionService.hasAllPermissions(role, requiredPermissions);
    }
    
    /**
     * Check if a role has any of the required permissions for a specific operation
     */
    public boolean hasAnyRequiredPermissions(UserRole role, Set<Permission> requiredPermissions) {
        return rolePermissionService.hasAnyPermission(role, requiredPermissions);
    }
    
    /**
     * Validate that a role can perform a specific work order action
     */
    public boolean canPerformWorkOrderAction(UserRole role, WorkOrderAction action) {
        switch (action) {
            case VIEW:
                return canViewWorkOrders(role);
            case CREATE:
                return canCreateWorkOrders(role);
            case UPDATE:
                return canUpdateWorkOrders(role);
            case DELETE:
                return canDeleteWorkOrders(role);
            case RELEASE:
                return canReleaseWorkOrders(role);
            case COMPLETE:
                return canCompleteWorkOrders(role);
            case CANCEL:
                return canCancelWorkOrders(role);
            case HOLD:
                return canHoldWorkOrders(role);
            case RESUME:
                return canResumeWorkOrders(role);
            default:
                return false;
        }
    }
    
    /**
     * Validate that a role can perform a specific routing action
     */
    public boolean canPerformRoutingAction(UserRole role, RoutingAction action) {
        switch (action) {
            case VIEW:
                return canViewRouting(role);
            case CREATE:
                return canCreateRouting(role);
            case UPDATE:
                return canUpdateRouting(role);
            case DELETE:
                return canDeleteRouting(role);
            default:
                return false;
        }
    }
    
    /**
     * Validate that a role can perform a specific WIP action
     */
    public boolean canPerformWIPAction(UserRole role, WIPAction action) {
        switch (action) {
            case VIEW:
                return canViewWIP(role);
            case MOVE:
                return canMoveWIP(role);
            case HOLD:
                return canHoldWIP(role);
            case RELEASE:
                return canReleaseWIP(role);
            default:
                return false;
        }
    }
    
    /**
     * Validate that a role can perform a specific capacity action
     */
    public boolean canPerformCapacityAction(UserRole role, CapacityAction action) {
        switch (action) {
            case VIEW:
                return canViewCapacity(role);
            case MANAGE:
                return canManageCapacity(role);
            default:
                return false;
        }
    }
    
    /**
     * Validate that a role can perform a specific operation action
     */
    public boolean canPerformOperationAction(UserRole role, OperationAction action) {
        switch (action) {
            case VIEW:
                return canViewOperations(role);
            case CREATE:
                return canCreateOperations(role);
            case UPDATE:
                return canUpdateOperations(role);
            case DELETE:
                return canDeleteOperations(role);
            default:
                return false;
        }
    }
    
    /**
     * Work order action enum
     */
    public enum WorkOrderAction {
        VIEW, CREATE, UPDATE, DELETE, RELEASE, COMPLETE, CANCEL, HOLD, RESUME
    }
    
    /**
     * Routing action enum
     */
    public enum RoutingAction {
        VIEW, CREATE, UPDATE, DELETE
    }
    
    /**
     * WIP action enum
     */
    public enum WIPAction {
        VIEW, MOVE, HOLD, RELEASE
    }
    
    /**
     * Capacity action enum
     */
    public enum CapacityAction {
        VIEW, MANAGE
    }
    
    /**
     * Operation action enum
     */
    public enum OperationAction {
        VIEW, CREATE, UPDATE, DELETE
    }
}