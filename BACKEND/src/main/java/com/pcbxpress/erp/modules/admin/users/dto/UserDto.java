package com.pcbxpress.erp.modules.admin.users.dto;

import com.pcbxpress.erp.modules.admin.users.model.User;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Users
 */
public record UserDto(
    String id,
    String username,
    String name,
    String email,
    String employeeCode,
    User.Role role,
    String department,
    boolean isActive,
    String phone,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    OffsetDateTime lastLoginAt,
    String notes
) {
}