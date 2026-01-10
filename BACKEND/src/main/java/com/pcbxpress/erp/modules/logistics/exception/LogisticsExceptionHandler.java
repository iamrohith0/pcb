package com.pcbxpress.erp.modules.logistics.exception;

import com.pcbxpress.erp.modules.logistics.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Global exception handler for logistics operations
 */
@RestControllerAdvice
public class LogisticsExceptionHandler {
    
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
    
    /**
     * Handle IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        ApiResponse<Object> response = ApiResponse.error("Invalid argument: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    /**
     * Handle Exception (fallback)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        ApiResponse<Object> response = ApiResponse.error("An unexpected error occurred: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}