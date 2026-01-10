package com.pcbxpress.erp.modules.admin.permissions.dto;

import com.pcbxpress.erp.modules.admin.permissions.model.Permission;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Permissions
 */
public record PermissionDto(
    String id,
    String code,
    String name,
    String description,
    String module,
    String operation,
    boolean isSystem,
    boolean isActive,
    Permission.PermissionType permissionType,
    Integer displayOrder,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    String createdBy,
    String updatedBy,
    String notes
) {
}