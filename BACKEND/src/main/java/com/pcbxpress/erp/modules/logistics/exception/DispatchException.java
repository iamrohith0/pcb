package com.pcbxpress.erp.modules.logistics.exception;

/**
 * Exception for dispatch operations
 */
public class DispatchException extends LogisticsException {
    
    public DispatchException(String message) {
        super(message, "DISPATCH_ERROR");
    }
    
    public DispatchException(String message, String details) {
        super(message, "DISPATCH_ERROR", details);
    }
    
    public DispatchException(String message, Throwable cause) {
        super(message, cause, "DISPATCH_ERROR");
    }
    
    public DispatchException(String message, Throwable cause, String details) {
        super(message, cause, "DISPATCH_ERROR", details);
    }
    
    public static class NotFoundException extends DispatchException {
        public NotFoundException(String id) {
            super("Dispatch not found: " + id, "DISPATCH_NOT_FOUND");
        }
    }
    
    public static class DuplicateCodeException extends DispatchException {
        public DuplicateCodeException(String code) {
            super("Dispatch code already exists: " + code, "DUPLICATE_DISPATCH_CODE");
        }
    }
    
    public static class InvalidStatusTransitionException extends DispatchException {
        public InvalidStatusTransitionException(String fromStatus, String toStatus) {
            super("Invalid status transition from " + fromStatus + " to " + toStatus,
                  "INVALID_STATUS_TRANSITION");
        }
    }
    
    public static class ValidationException extends DispatchException {
        public ValidationException(String message) {
            super(message, "DISPATCH_VALIDATION_ERROR");
        }
    }
}