package com.pcbxpress.erp.modules.admin.roles.dto;

import com.pcbxpress.erp.modules.admin.roles.model.Role;

/**
 * Payload DTO for creating and updating Roles
 */
public record RolePayload(
    String roleKey,
    String name,
    String description,
    boolean isActive,
    Role.RoleType roleType,
    String department,
    String notes
) {
}