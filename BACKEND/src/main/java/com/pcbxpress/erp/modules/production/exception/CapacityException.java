package com.pcbxpress.erp.modules.production.exception;

/**
 * Exception for capacity related errors
 */
public class CapacityException extends ProductionException {
    
    public CapacityException(String message) {
        super(message, "CAPACITY_ERROR");
    }
    
    public CapacityException(String message, Throwable cause) {
        super(message, cause, "CAPACITY_ERROR");
    }
    
    public static class CapacityNotFoundException extends CapacityException {
        public CapacityNotFoundException(String machineId) {
            super("Capacity not found for machine: " + machineId);
        }
    }
    
    public static class CapacityValidationException extends CapacityException {
        public CapacityValidationException(String message) {
            super("Capacity validation failed: " + message);
        }
    }
    
    public static class CapacityPermissionException extends CapacityException {
        public CapacityPermissionException(String action, String machineId) {
            super("Permission denied for action '" + action + "' on capacity: " + machineId);
        }
    }
}