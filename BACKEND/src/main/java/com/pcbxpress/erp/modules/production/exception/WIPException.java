package com.pcbxpress.erp.modules.production.exception;

/**
 * Exception for WIP related errors
 */
public class WIPException extends ProductionException {
    
    public WIPException(String message) {
        super(message, "WIP_ERROR");
    }
    
    public WIPException(String message, Throwable cause) {
        super(message, cause, "WIP_ERROR");
    }
    
    public static class WIPNotFoundException extends WIPException {
        public WIPNotFoundException(String workOrderId) {
            super("WIP not found for work order: " + workOrderId);
        }
    }
    
    public static class WIPValidationException extends WIPException {
        public WIPValidationException(String message) {
            super("WIP validation failed: " + message);
        }
    }
    
    public static class WIPPermissionException extends WIPException {
        public WIPPermissionException(String action, String workOrderId) {
            super("Permission denied for action '" + action + "' on WIP: " + workOrderId);
        }
    }
}