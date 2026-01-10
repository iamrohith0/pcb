package com.pcbxpress.erp.modules.logistics.exception;

/**
 * Exception for tracking operations
 */
public class TrackingException extends LogisticsException {
    
    public TrackingException(String message) {
        super(message, "TRACKING_ERROR");
    }
    
    public TrackingException(String message, String details) {
        super(message, "TRACKING_ERROR", details);
    }
    
    public TrackingException(String message, Throwable cause) {
        super(message, cause, "TRACKING_ERROR");
    }
    
    public TrackingException(String message, Throwable cause, String details) {
        super(message, cause, "TRACKING_ERROR", details);
    }
    
    public static class NotFoundException extends TrackingException {
        public NotFoundException(String id) {
            super("Tracking not found: " + id, "TRACKING_NOT_FOUND");
        }
    }
    
    public static class DuplicateTrackingIdException extends TrackingException {
        public DuplicateTrackingIdException(String trackingId) {
            super("Tracking ID already exists: " + trackingId, "DUPLICATE_TRACKING_ID");
        }
    }
    
    public static class InvalidTrackingIdException extends TrackingException {
        public InvalidTrackingIdException(String trackingId) {
            super("Invalid tracking ID format: " + trackingId, "INVALID_TRACKING_ID");
        }
    }
    
    public static class ValidationException extends TrackingException {
        public ValidationException(String message) {
            super(message, "TRACKING_VALIDATION_ERROR");
        }
    }
}