package com.pcbxpress.erp.modules.production.exception;

import com.pcbxpress.erp.modules.audit.service.AuditService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for production module
 */
@RestControllerAdvice
public class ProductionExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(ProductionExceptionHandler.class);
    
    private final AuditService auditService;
    
    public ProductionExceptionHandler(AuditService auditService) {
        this.auditService = auditService;
    }
    
    /**
     * Handle production exceptions
     */
    @ExceptionHandler(ProductionException.class)
    public ResponseEntity<Map<String, Object>> handleProductionException(ProductionException ex) {
        logger.error("Production exception occurred: {}", ex.getMessage(), ex);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", OffsetDateTime.now());
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorResponse.put("error", "Production Error");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("path", "/api/production/**");
        
        // Log audit event for production error
        auditService.logProductionSystemError("PRODUCTION", "SYSTEM", null, 
                                            null, "Production operation failed", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
    
    /**
     * Handle work order exceptions
     */
    @ExceptionHandler(WorkOrderException.class)
    public ResponseEntity<Map<String, Object>> handleWorkOrderException(WorkOrderException ex) {
        logger.error("Work order exception occurred: {}", ex.getMessage(), ex);
        
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String error = "Work Order Error";
        
        // Determine status based on exception type
        if (ex instanceof WorkOrderException.WorkOrderNotFoundException) {
            status = HttpStatus.NOT_FOUND;
            error = "Work Order Not Found";
        } else if (ex instanceof WorkOrderException.WorkOrderAlreadyExistsException) {
            status = HttpStatus.CONFLICT;
            error = "Work Order Already Exists";
        } else if (ex instanceof WorkOrderException.WorkOrderValidationException) {
            status = HttpStatus.BAD_REQUEST;
            error = "Work Order Validation Error";
        } else if (ex instanceof WorkOrderException.WorkOrderPermissionException) {
            status = HttpStatus.FORBIDDEN;
            error = "Work Order Permission Denied";
        }
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", OffsetDateTime.now());
        errorResponse.put("status", status.value());
        errorResponse.put("error", error);
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("path", "/api/production/work-orders/**");
        
        // Log audit event for work order error
        auditService.logProductionSystemError("PRODUCTION", "WORK_ORDER", null, 
                                            null, "Work order operation failed", ex.getMessage());
        
        return ResponseEntity.status(status).body(errorResponse);
    }
    
    /**
     * Handle routing exceptions
     */
    @ExceptionHandler(RoutingException.class)
    public ResponseEntity<Map<String, Object>> handleRoutingException(RoutingException ex) {
        logger.error("Routing exception occurred: {}", ex.getMessage(), ex);
        
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String error = "Routing Error";
        
        // Determine status based on exception type
        if (ex instanceof RoutingException.RoutingNotFoundException) {
            status = HttpStatus.NOT_FOUND;
            error = "Routing Not Found";
        } else if (ex instanceof RoutingException.RoutingAlreadyExistsException) {
            status = HttpStatus.CONFLICT;
            error = "Routing Already Exists";
        } else if (ex instanceof RoutingException.RoutingValidationException) {
            status = HttpStatus.BAD_REQUEST;
            error = "Routing Validation Error";
        } else if (ex instanceof RoutingException.RoutingPermissionException) {
            status = HttpStatus.FORBIDDEN;
            error = "Routing Permission Denied";
        }
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", OffsetDateTime.now());
        errorResponse.put("status", status.value());
        errorResponse.put("error", error);
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("path", "/api/production/routing/**");
        
        // Log audit event for routing error
        auditService.logProductionSystemError("PRODUCTION", "ROUTING", null, 
                                            null, "Routing operation failed", ex.getMessage());
        
        return ResponseEntity.status(status).body(errorResponse);
    }
    
    /**
     * Handle WIP exceptions
     */
    @ExceptionHandler(WIPException.class)
    public ResponseEntity<Map<String, Object>> handleWIPException(WIPException ex) {
        logger.error("WIP exception occurred: {}", ex.getMessage(), ex);
        
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String error = "WIP Error";
        
        // Determine status based on exception type
        if (ex instanceof WIPException.WIPNotFoundException) {
            status = HttpStatus.NOT_FOUND;
            error = "WIP Not Found";
        } else if (ex instanceof WIPException.WIPValidationException) {
            status = HttpStatus.BAD_REQUEST;
            error = "WIP Validation Error";
        } else if (ex instanceof WIPException.WIPPermissionException) {
            status = HttpStatus.FORBIDDEN;
            error = "WIP Permission Denied";
        }
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", OffsetDateTime.now());
        errorResponse.put("status", status.value());
        errorResponse.put("error", error);
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("path", "/api/production/wip/**");
        
        // Log audit event for WIP error
        auditService.logProductionSystemError("PRODUCTION", "WIP", null, 
                                            null, "WIP operation failed", ex.getMessage());
        
        return ResponseEntity.status(status).body(errorResponse);
    }
    
    /**
     * Handle capacity exceptions
     */
    @ExceptionHandler(CapacityException.class)
    public ResponseEntity<Map<String, Object>> handleCapacityException(CapacityException ex) {
        logger.error("Capacity exception occurred: {}", ex.getMessage(), ex);
        
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String error = "Capacity Error";
        
        // Determine status based on exception type
        if (ex instanceof CapacityException.CapacityNotFoundException) {
            status = HttpStatus.NOT_FOUND;
            error = "Capacity Not Found";
        } else if (ex instanceof CapacityException.CapacityValidationException) {
            status = HttpStatus.BAD_REQUEST;
            error = "Capacity Validation Error";
        } else if (ex instanceof CapacityException.CapacityPermissionException) {
            status = HttpStatus.FORBIDDEN;
            error = "Capacity Permission Denied";
        }
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", OffsetDateTime.now());
        errorResponse.put("status", status.value());
        errorResponse.put("error", error);
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("path", "/api/production/capacity/**");
        
        // Log audit event for capacity error
        auditService.logProductionSystemError("PRODUCTION", "CAPACITY", null, 
                                            null, "Capacity operation failed", ex.getMessage());
        
        return ResponseEntity.status(status).body(errorResponse);
    }
    
    /**
     * Handle operation exceptions
     */
    @ExceptionHandler(OperationException.class)
    public ResponseEntity<Map<String, Object>> handleOperationException(OperationException ex) {
        logger.error("Operation exception occurred: {}", ex.getMessage(), ex);
        
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String error = "Operation Error";
        
        // Determine status based on exception type
        if (ex instanceof OperationException.OperationNotFoundException) {
            status = HttpStatus.NOT_FOUND;
            error = "Operation Not Found";
        } else if (ex instanceof OperationException.OperationAlreadyExistsException) {
            status = HttpStatus.CONFLICT;
            error = "Operation Already Exists";
        } else if (ex instanceof OperationException.OperationValidationException) {
            status = HttpStatus.BAD_REQUEST;
            error = "Operation Validation Error";
        } else if (ex instanceof OperationException.OperationPermissionException) {
            status = HttpStatus.FORBIDDEN;
            error = "Operation Permission Denied";
        }
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", OffsetDateTime.now());
        errorResponse.put("status", status.value());
        errorResponse.put("error", error);
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("path", "/api/production/operations/**");
        
        // Log audit event for operation error
        auditService.logProductionSystemError("PRODUCTION", "OPERATION", null, 
                                            null, "Operation operation failed", ex.getMessage());
        
        return ResponseEntity.status(status).body(errorResponse);
    }
    
    /**
     * Handle validation exceptions
     */
    @ExceptionHandler(ProductionValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(ProductionValidationException ex) {
        logger.error("Production validation exception occurred: {}", ex.getMessage(), ex);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", OffsetDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "Validation Error");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("validationErrors", ex.getValidationErrors());
        errorResponse.put("path", "/api/production/**");
        
        // Log audit event for validation error
        auditService.logProductionSystemError("PRODUCTION", "VALIDATION", null, 
                                            null, "Production validation failed", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
    
    /**
     * Handle permission exceptions
     */
    @ExceptionHandler(ProductionPermissionException.class)
    public ResponseEntity<Map<String, Object>> handlePermissionException(ProductionPermissionException ex) {
        logger.warn("Production permission exception occurred: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", OffsetDateTime.now());
        errorResponse.put("status", HttpStatus.FORBIDDEN.value());
        errorResponse.put("error", "Permission Denied");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("errorCode", ex.getErrorCode());
        errorResponse.put("requiredPermissions", ex.getRequiredPermissions());
        errorResponse.put("userRole", ex.getUserRole());
        errorResponse.put("path", "/api/production/**");
        
        // Log audit event for permission denied
        auditService.logPermissionDenied("PRODUCTION", ex.getEntityType(), ex.getEntityId(),
                                       null, ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }
    
    /**
     * Handle general exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(Exception ex) {
        logger.error("General exception occurred: {}", ex.getMessage(), ex);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", OffsetDateTime.now());
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorResponse.put("error", "Internal Server Error");
        errorResponse.put("message", "An unexpected error occurred");
        errorResponse.put("path", "/api/production/**");
        
        // Log audit event for system error
        auditService.logProductionSystemError("PRODUCTION", "SYSTEM", null, 
                                            null, "Unexpected system error", ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}