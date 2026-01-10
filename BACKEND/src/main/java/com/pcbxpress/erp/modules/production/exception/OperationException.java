package com.pcbxpress.erp.modules.production.exception;

/**
 * Exception for operation related errors
 */
public class OperationException extends ProductionException {
    
    public OperationException(String message) {
        super(message, "OPERATION_ERROR");
    }
    
    public OperationException(String message, Throwable cause) {
        super(message, cause, "OPERATION_ERROR");
    }
    
    public static class OperationNotFoundException extends OperationException {
        public OperationNotFoundException(String operationId) {
            super("Operation not found: " + operationId);
        }
    }
    
    public static class OperationAlreadyExistsException extends OperationException {
        public OperationAlreadyExistsException(String operationName) {
            super("Operation already exists with name: " + operationName);
        }
    }
    
    public static class OperationValidationException extends OperationException {
        public OperationValidationException(String message) {
            super("Operation validation failed: " + message);
        }
    }
    
    public static class OperationPermissionException extends OperationException {
        public OperationPermissionException(String action, String operationId) {
            super("Permission denied for action '" + action + "' on operation: " + operationId);
        }
    }
}