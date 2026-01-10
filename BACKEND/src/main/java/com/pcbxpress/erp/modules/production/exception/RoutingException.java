package com.pcbxpress.erp.modules.production.exception;

/**
 * Exception for routing related errors
 */
public class RoutingException extends ProductionException {
    
    public RoutingException(String message) {
        super(message, "ROUTING_ERROR");
    }
    
    public RoutingException(String message, Throwable cause) {
        super(message, cause, "ROUTING_ERROR");
    }
    
    public static class RoutingNotFoundException extends RoutingException {
        public RoutingNotFoundException(String routingId) {
            super("Routing not found: " + routingId);
        }
    }
    
    public static class RoutingAlreadyExistsException extends RoutingException {
        public RoutingAlreadyExistsException(String routingCode) {
            super("Routing already exists with code: " + routingCode);
        }
    }
    
    public static class RoutingValidationException extends RoutingException {
        public RoutingValidationException(String message) {
            super("Routing validation failed: " + message);
        }
    }
    
    public static class RoutingPermissionException extends RoutingException {
        public RoutingPermissionException(String action, String routingId) {
            super("Permission denied for action '" + action + "' on routing: " + routingId);
        }
    }
}