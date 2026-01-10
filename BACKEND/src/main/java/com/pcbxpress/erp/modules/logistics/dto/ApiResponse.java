package com.pcbxpress.erp.modules.logistics.dto;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Standardized API Response wrapper for logistics operations
 */
public record ApiResponse<T>(
    boolean success,
    String message,
    T data,
    List<String> errors,
    OffsetDateTime timestamp,
    String requestId
) {
    
    /**
     * Create a successful response with data
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data, null, OffsetDateTime.now(), generateRequestId());
    }
    
    /**
     * Create a successful response without data
     */
    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null, null, OffsetDateTime.now(), generateRequestId());
    }
    
    /**
     * Create an error response
     */
    public static <T> ApiResponse<T> error(String message, List<String> errors) {
        return new ApiResponse<>(false, message, null, errors, OffsetDateTime.now(), generateRequestId());
    }
    
    /**
     * Create an error response with single error
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, null, OffsetDateTime.now(), generateRequestId());
    }
    
    /**
     * Create a not found response
     */
    public static <T> ApiResponse<T> notFound(String message) {
        return new ApiResponse<>(false, message, null, null, OffsetDateTime.now(), generateRequestId());
    }
    
    /**
     * Create a validation error response
     */
    public static <T> ApiResponse<T> validationError(List<String> errors) {
        return new ApiResponse<>(false, "Validation failed", null, errors, OffsetDateTime.now(), generateRequestId());
    }
    
    /**
     * Create a response with custom status
     */
    public static <T> ApiResponse<T> create(boolean success, String message, T data, List<String> errors) {
        return new ApiResponse<>(success, message, data, errors, OffsetDateTime.now(), generateRequestId());
    }
    
    private static String generateRequestId() {
        return "REQ-" + System.currentTimeMillis() + "-" + (int)(Math.random() * 10000);
    }
}