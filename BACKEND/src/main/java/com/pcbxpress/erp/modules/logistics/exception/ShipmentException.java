package com.pcbxpress.erp.modules.logistics.exception;

/**
 * Exception for shipment operations
 */
public class ShipmentException extends LogisticsException {
    
    public ShipmentException(String message) {
        super(message, "SHIPMENT_ERROR");
    }
    
    public ShipmentException(String message, String details) {
        super(message, "SHIPMENT_ERROR", details);
    }
    
    public ShipmentException(String message, Throwable cause) {
        super(message, cause, "SHIPMENT_ERROR");
    }
    
    public ShipmentException(String message, Throwable cause, String details) {
        super(message, cause, "SHIPMENT_ERROR", details);
    }
    
    public static class NotFoundException extends ShipmentException {
        public NotFoundException(String id) {
            super("Shipment not found: " + id, "SHIPMENT_NOT_FOUND");
        }
    }
    
    public static class DuplicateCodeException extends ShipmentException {
        public DuplicateCodeException(String code) {
            super("Shipment code already exists: " + code, "DUPLICATE_SHIPMENT_CODE");
        }
    }
    
    public static class InvalidStatusTransitionException extends ShipmentException {
        public InvalidStatusTransitionException(String fromStatus, String toStatus) {
            super("Invalid status transition from " + fromStatus + " to " + toStatus, 
                  "INVALID_STATUS_TRANSITION");
        }
    }
    
    public static class ValidationException extends ShipmentException {
        public ValidationException(String message) {
            super(message, "SHIPMENT_VALIDATION_ERROR");
        }
    }
}