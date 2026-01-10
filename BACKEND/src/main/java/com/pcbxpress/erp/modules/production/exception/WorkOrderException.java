package com.pcbxpress.erp.modules.production.exception;

/**
 * Exception for work order related errors
 */
public class WorkOrderException extends ProductionException {
    
    public WorkOrderException(String message) {
        super(message, "WORK_ORDER_ERROR");
    }
    
    public WorkOrderException(String message, Throwable cause) {
        super(message, cause, "WORK_ORDER_ERROR");
    }
    
    public static class WorkOrderNotFoundException extends WorkOrderException {
        public WorkOrderNotFoundException(String workOrderId) {
            super("Work order not found: " + workOrderId);
        }
    }
    
    public static class WorkOrderAlreadyExistsException extends WorkOrderException {
        public WorkOrderAlreadyExistsException(String workOrderNumber) {
            super("Work order already exists with number: " + workOrderNumber);
        }
    }
    
    public static class WorkOrderStatusTransitionException extends WorkOrderException {
        public WorkOrderStatusTransitionException(String fromStatus, String toStatus) {
            super("Invalid status transition from " + fromStatus + " to " + toStatus);
        }
    }
    
    public static class WorkOrderValidationException extends WorkOrderException {
        public WorkOrderValidationException(String message) {
            super("Work order validation failed: " + message);
        }
    }
    
    public static class WorkOrderPermissionException extends WorkOrderException {
        public WorkOrderPermissionException(String action, String workOrderId) {
            super("Permission denied for action '" + action + "' on work order: " + workOrderId);
        }
    }
}