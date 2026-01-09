package com.pcbxpress.erp.common.web;

import java.time.OffsetDateTime;

public record ApiResponse(String message, String path, OffsetDateTime timestamp) {

    public static ApiResponse of(String message, String path) {
        return new ApiResponse(message, path, OffsetDateTime.now());
    }
}
