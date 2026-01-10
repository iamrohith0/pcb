package com.pcbxpress.erp.modules.admin.permissions.dto;

import com.pcbxpress.erp.modules.admin.permissions.model.Permission;

/**
 * Payload DTO for creating and updating Permissions
 */
public record PermissionPayload(
    String code,
    String name,
    String description,
    String module,
    String operation,
    boolean isSystem,
    boolean isActive,
    Permission.PermissionType permissionType,
    Integer displayOrder,
    String notes
) {
}