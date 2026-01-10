package com.pcbxpress.erp.modules.production.exception;

import com.pcbxpress.erp.modules.auth.model.Permission;
import com.pcbxpress.erp.modules.auth.model.UserRole;

/**
 * Exception for production permission errors
 */
public class ProductionPermissionException extends ProductionException {
    
    private final String entityType;
    private final String entityId;
    private final String operation;
    private final UserRole userRole;
    private final Permission[] requiredPermissions;
    
    public ProductionPermissionException(String message, String entityType, String entityId, 
                                       String operation, UserRole userRole, Permission[] requiredPermissions) {
        super(message, "PERMISSION_ERROR");
        this.entityType = entityType;
        this.entityId = entityId;
        this.operation = operation;
        this.userRole = userRole;
        this.requiredPermissions = requiredPermissions;
    }
    
    public String getEntityType() {
        return entityType;
    }
    
    public String getEntityId() {
        return entityId;
    }
    
    public String getOperation() {
        return operation;
    }
    
    public UserRole getUserRole() {
        return userRole;
    }
    
    public Permission[] getRequiredPermissions() {
        return requiredPermissions;
    }
}