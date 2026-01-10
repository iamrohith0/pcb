package com.pcbxpress.erp.modules.admin.users.dto;

import com.pcbxpress.erp.modules.admin.users.model.User;

/**
 * Payload DTO for creating and updating Users
 */
public record UserPayload(
    String username,
    String name,
    String email,
    String employeeCode,
    User.Role role,
    String department,
    boolean isActive,
    String phone,
    String notes
) {
}