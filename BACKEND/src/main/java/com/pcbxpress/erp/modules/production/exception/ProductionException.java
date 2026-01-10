package com.pcbxpress.erp.modules.production.exception;

/**
 * Base exception for production module operations
 */
public class ProductionException extends RuntimeException {
    
    private final String errorCode;
    
    public ProductionException(String message) {
        super(message);
        this.errorCode = "PRODUCTION_ERROR";
    }
    
    public ProductionException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public ProductionException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "PRODUCTION_ERROR";
    }
    
    public ProductionException(String message, Throwable cause, String errorCode) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}