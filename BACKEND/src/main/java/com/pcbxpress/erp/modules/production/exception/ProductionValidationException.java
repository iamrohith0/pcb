package com.pcbxpress.erp.modules.production.exception;

import java.util.List;

/**
 * Exception for production validation errors
 */
public class ProductionValidationException extends ProductionException {
    
    private final List<String> validationErrors;
    
    public ProductionValidationException(String message, List<String> validationErrors) {
        super(message, "VALIDATION_ERROR");
        this.validationErrors = validationErrors;
    }
    
    public ProductionValidationException(String message, List<String> validationErrors, Throwable cause) {
        super(message, cause, "VALIDATION_ERROR");
        this.validationErrors = validationErrors;
    }
    
    public List<String> getValidationErrors() {
        return validationErrors;
    }
}