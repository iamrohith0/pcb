package com.pcbxpress.erp.modules.auth.dto;

public record AuthUserDto(
    String id,
    String name,
    String email,
    String role
) {
}
