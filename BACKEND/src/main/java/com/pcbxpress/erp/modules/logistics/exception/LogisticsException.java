package com.pcbxpress.erp.modules.logistics.exception;

/**
 * Custom exception for logistics operations
 */
public class LogisticsException extends RuntimeException {
    
    private final String errorCode;
    private final String details;
    
    public LogisticsException(String message) {
        super(message);
        this.errorCode = "LOGISTICS_ERROR";
        this.details = null;
    }
    
    public LogisticsException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.details = null;
    }
    
    public LogisticsException(String message, String errorCode, String details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details;
    }
    
    public LogisticsException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "LOGISTICS_ERROR";
        this.details = null;
    }
    
    public LogisticsException(String message, Throwable cause, String errorCode) {
        super(message, cause);
        this.errorCode = errorCode;
        this.details = null;
    }
    
    public LogisticsException(String message, Throwable cause, String errorCode, String details) {
        super(message, cause);
        this.errorCode = errorCode;
        this.details = details;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public String getDetails() {
        return details;
    }
}