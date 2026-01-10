package com.pcbxpress.erp.modules.admin.roles.dto;

import com.pcbxpress.erp.modules.admin.roles.model.Role;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Roles
 */
public record RoleDto(
    String id,
    String roleKey,
    String name,
    String description,
    boolean isActive,
    Role.RoleType roleType,
    String department,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    String createdBy,
    String updatedBy,
    String notes
) {
}