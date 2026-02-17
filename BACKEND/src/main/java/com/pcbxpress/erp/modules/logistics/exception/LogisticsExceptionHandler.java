package com.pcbxpress.erp.modules.logistics.exception;

import com.pcbxpress.erp.modules.logistics.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.validation.ConstraintViolationException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

/**
 * Global exception handler for logistics operations.
 * Converts all validation and database errors to HTTP 400 to prevent 500
 * errors.
 */
@RestControllerAdvice(basePackages = "com.pcbxpress.erp.modules.logistics")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class LogisticsExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(LogisticsExceptionHandler.class);

    /**
     * Handle LogisticsException
     */
    @ExceptionHandler(LogisticsException.class)
    public ResponseEntity<ApiResponse<Object>> handleLogisticsException(LogisticsException ex) {
        List<String> errors = ex.getDetails() != null ? Arrays.asList(ex.getDetails()) : null;
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle DispatchException
     */
    @ExceptionHandler(DispatchException.class)
    public ResponseEntity<ApiResponse<Object>> handleDispatchException(DispatchException ex) {
        List<String> errors = ex.getDetails() != null ? Arrays.asList(ex.getDetails()) : null;
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle Dispatch ValidationException separately for simple response structure
     */
    @ExceptionHandler(DispatchException.ValidationException.class)
    public ResponseEntity<Map<String, String>> handleDispatchValidation(DispatchException.ValidationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }

    /**
     * Handle ShipmentException
     */
    @ExceptionHandler(ShipmentException.class)
    public ResponseEntity<ApiResponse<Object>> handleShipmentException(ShipmentException ex) {
        List<String> errors = ex.getDetails() != null ? Arrays.asList(ex.getDetails()) : null;
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle TrackingException
     */
    @ExceptionHandler(TrackingException.class)
    public ResponseEntity<ApiResponse<Object>> handleTrackingException(TrackingException ex) {
        List<String> errors = ex.getDetails() != null ? Arrays.asList(ex.getDetails()) : null;
        ApiResponse<Object> response = ApiResponse.error(ex.getMessage(), errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle NoSuchElementException
     */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiResponse<Object>> handleNoSuchElementException(NoSuchElementException ex) {
        ApiResponse<Object> response = ApiResponse.notFound(ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", ex.getMessage()));
    }

    /**
     * Handle DataIntegrityViolationException (FK violations, unique constraints,
     * etc.)
     * This prevents 500 errors when database constraints fail.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        String message = "Data integrity error: ";

        // Extract meaningful message from the exception
        Throwable cause = ex.getMostSpecificCause();
        if (cause != null && cause.getMessage() != null) {
            String causeMsg = cause.getMessage().toLowerCase();

            // Check for foreign key violation
            if (causeMsg.contains("foreign key") || causeMsg.contains("fk_")
                    || causeMsg.contains("referential integrity")) {
                message = "Invalid reference: One or more referenced records do not exist. " +
                        "Please ensure Order, Customer, and Warehouse are valid.";
            }
            // Check for unique constraint violation
            else if (causeMsg.contains("unique") || causeMsg.contains("duplicate")) {
                message = "Duplicate entry: A record with this value already exists.";
            }
            // Check for null constraint violation
            else if (causeMsg.contains("not-null") || causeMsg.contains("cannot be null")) {
                message = "Missing required field: A required value was not provided.";
            } else {
                message += cause.getMessage();
            }
        } else {
            message += "Database constraint violated. Please check your input.";
        }

        ApiResponse<Object> response = ApiResponse.error(message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle ConstraintViolationException (Bean Validation / JSR-380)
     * This catches @NotNull, @Size, @Valid annotation violations.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraintViolation(ConstraintViolationException ex) {
        List<String> errors = ex.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                .collect(Collectors.toList());

        String message = "Validation failed: " + String.join(", ", errors);
        ApiResponse<Object> response = ApiResponse.error(message, errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Handle MethodArgumentNotValidException (Spring MVC @Valid on request body)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        List<String> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.toList());

        String message = "Validation failed: " + String.join(", ", errors);
        ApiResponse<Object> response = ApiResponse.error(message, errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

}