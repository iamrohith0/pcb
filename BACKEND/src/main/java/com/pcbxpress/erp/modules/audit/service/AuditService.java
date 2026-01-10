package com.pcbxpress.erp.modules.audit.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pcbxpress.erp.modules.audit.model.AuditEvent;
import com.pcbxpress.erp.modules.audit.model.AuditEvent.Operation;
import com.pcbxpress.erp.modules.audit.repository.AuditEventRepository;
import com.pcbxpress.erp.modules.auth.model.User;
import com.pcbxpress.erp.modules.auth.model.UserRole;
import com.pcbxpress.erp.modules.auth.service.AuthenticationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

/**
 * Audit Service for logging system events
 */
@Service
public class AuditService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);
    
    private final AuditEventRepository auditEventRepository;
    private final AuthenticationService authenticationService;
    private final ObjectMapper objectMapper;
    
    @Autowired
    public AuditService(AuditEventRepository auditEventRepository, 
                       AuthenticationService authenticationService) {
        this.auditEventRepository = auditEventRepository;
        this.authenticationService = authenticationService;
        this.objectMapper = new ObjectMapper();
    }
    
    /**
     * Log a successful operation
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSuccess(String module, String entityType, String entityId, 
                          Operation operation, String description, 
                          Object oldValues, Object newValues) {
        try {
            // Get current user context - in a real implementation, this would come from security context
            String username = "system"; // Placeholder - would be from security context
            UserRole userRole = null; // Placeholder - would be from security context
            String userId = null; // Placeholder - would be from security context
            
            AuditEvent event = createAuditEvent(
                module, entityType, entityId, operation, description,
                username, userRole, userId, true, null, oldValues, newValues
            );
            
            auditEventRepository.save(event);
            logger.debug("Audit event logged successfully: {} {} {}", module, operation, entityType);
        } catch (Exception e) {
            logger.error("Failed to log audit event: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Log a failed operation
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailure(String module, String entityType, String entityId,
                          Operation operation, String description, String errorMessage,
                          Object oldValues, Object newValues) {
        try {
            // Get current user context - in a real implementation, this would come from security context
            String username = "system"; // Placeholder - would be from security context
            UserRole userRole = null; // Placeholder - would be from security context
            String userId = null; // Placeholder - would be from security context
            
            AuditEvent event = createAuditEvent(
                module, entityType, entityId, operation, description,
                username, userRole, userId, false, errorMessage, oldValues, newValues
            );
            
            auditEventRepository.save(event);
            logger.debug("Audit failure event logged: {} {} {} - {}", module, operation, entityType, errorMessage);
        } catch (Exception e) {
            logger.error("Failed to log audit failure event: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Log a permission denied event
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logPermissionDenied(String module, String entityType, String entityId,
                                   Operation operation, String description) {
        try {
            // Get current user context - in a real implementation, this would come from security context
            String username = "system"; // Placeholder - would be from security context
            UserRole userRole = null; // Placeholder - would be from security context
            String userId = null; // Placeholder - would be from security context
            
            AuditEvent event = createAuditEvent(
                module, entityType, entityId, operation, description,
                username, userRole, userId, false, "Permission denied", null, null
            );
            
            auditEventRepository.save(event);
            logger.warn("Permission denied event logged: {} {} {} for user {}", 
                       module, operation, entityType, username);
        } catch (Exception e) {
            logger.error("Failed to log permission denied event: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Log a system error
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logSystemError(String module, String entityType, String entityId,
                              Operation operation, String description, String errorMessage) {
        try {
            // Get current user context - in a real implementation, this would come from security context
            String username = "system"; // Placeholder - would be from security context
            UserRole userRole = null; // Placeholder - would be from security context
            String userId = null; // Placeholder - would be from security context
            
            AuditEvent event = createAuditEvent(
                module, entityType, entityId, operation, description,
                username, userRole, userId, false, errorMessage, null, null
            );
            
            auditEventRepository.save(event);
            logger.error("System error event logged: {} {} {} - {}", 
                        module, operation, entityType, errorMessage);
        } catch (Exception e) {
            logger.error("Failed to log system error event: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Log a login event
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogin(String username, String ipAddress, String userAgent, boolean success) {
        try {
            AuditEvent event = createAuditEvent(
                "AUTH", "USER", username, Operation.LOGIN, 
                success ? "User login successful" : "User login failed",
                username, null, null, success, null, null, null
            );
            event.setIpAddress(ipAddress);
            event.setUserAgent(userAgent);
            
            auditEventRepository.save(event);
            logger.info("Login event logged for user {}: {}", username, success ? "SUCCESS" : "FAILED");
        } catch (Exception e) {
            logger.error("Failed to log login event for user {}: {}", username, e.getMessage(), e);
        }
    }
    
    /**
     * Log a logout event
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logLogout(String username, String ipAddress, String userAgent) {
        try {
            AuditEvent event = createAuditEvent(
                "AUTH", "USER", username, Operation.LOGOUT, "User logout",
                username, null, null, true, null, null, null
            );
            event.setIpAddress(ipAddress);
            event.setUserAgent(userAgent);
            
            auditEventRepository.save(event);
            logger.info("Logout event logged for user {}", username);
        } catch (Exception e) {
            logger.error("Failed to log logout event for user {}: {}", username, e.getMessage(), e);
        }
    }
    
    /**
     * Log a batch operation
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logBatchOperation(String module, String entityType, Operation operation,
                                 String description, int affectedRecords, Object details) {
        try {
            // Get current user context - in a real implementation, this would come from security context
            String username = "system"; // Placeholder - would be from security context
            UserRole userRole = null; // Placeholder - would be from security context
            String userId = null; // Placeholder - would be from security context
            
            Map<String, Object> batchDetails = new HashMap<>();
            batchDetails.put("affectedRecords", affectedRecords);
            batchDetails.put("details", details);
            
            AuditEvent event = createAuditEvent(
                module, entityType, null, operation, description,
                username, userRole, userId, true, null, null, batchDetails
            );
            
            auditEventRepository.save(event);
            logger.debug("Batch operation logged: {} {} {} - {} records affected", 
                        module, operation, entityType, affectedRecords);
        } catch (Exception e) {
            logger.error("Failed to log batch operation: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Log an import operation
     */
    public void logImport(String module, String entityType, String description, 
                         int importedRecords, Object importDetails) {
        logBatchOperation(module, entityType, Operation.IMPORT, description, importedRecords, importDetails);
    }
    
    /**
     * Log an export operation
     */
    public void logExport(String module, String entityType, String description, 
                         int exportedRecords, Object exportDetails) {
        logBatchOperation(module, entityType, Operation.EXPORT, description, exportedRecords, exportDetails);
    }
    
    /**
     * Log a permission check
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logPermissionCheck(String module, String entityType, String entityId,
                                  Operation operation, String username, UserRole userRole, boolean granted) {
        try {
            AuditEvent event = createAuditEvent(
                module, entityType, entityId, operation, 
                granted ? "Permission check passed" : "Permission check failed",
                username, userRole, null, granted, null, null, null
            );
            
            auditEventRepository.save(event);
            logger.debug("Permission check logged: {} {} {} for user {} - {}", 
                        module, operation, entityType, username, granted ? "GRANTED" : "DENIED");
        } catch (Exception e) {
            logger.error("Failed to log permission check: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Create an audit event
     */
    private AuditEvent createAuditEvent(String module, String entityType, String entityId,
                                       Operation operation, String description,
                                       String username, UserRole userRole, String userId,
                                       boolean success, String errorMessage,
                                       Object oldValues, Object newValues) {
        AuditEvent event = new AuditEvent();
        event.setId(java.util.UUID.randomUUID());
        event.setModule(module);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setOperation(operation);
        event.setDescription(description);
        event.setUsername(username);
        event.setSuccess(success);
        event.setErrorMessage(errorMessage);
        event.setTimestamp(OffsetDateTime.now(ZoneId.of("UTC")));
        
        if (userId != null) {
            try {
                event.setUserId(java.util.UUID.fromString(userId));
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid user ID format: {}", userId);
            }
        }
        
        if (oldValues != null) {
            event.setOldValues(serializeObject(oldValues));
        }
        
        if (newValues != null) {
            event.setNewValues(serializeObject(newValues));
        }
        
        return event;
    }
    
    /**
     * Serialize object to JSON string
     */
    private String serializeObject(Object obj) {
        if (obj == null) {
            return null;
        }
        
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            logger.warn("Failed to serialize object to JSON: {}", e.getMessage());
            return obj.toString();
        }
    }
    
    /**
     * Production-specific audit logging methods
     */
    
    /**
     * Log work order creation
     */
    public void logWorkOrderCreated(String workOrderId, String workOrderNumber, Object workOrderData) {
        logSuccess("PRODUCTION", "WORK_ORDER", workOrderId, Operation.CREATE, 
                  "Work order created: " + workOrderNumber, null, workOrderData);
    }
    
    /**
     * Log work order update
     */
    public void logWorkOrderUpdated(String workOrderId, String workOrderNumber, Object oldData, Object newData) {
        logSuccess("PRODUCTION", "WORK_ORDER", workOrderId, Operation.UPDATE, 
                  "Work order updated: " + workOrderNumber, oldData, newData);
    }
    
    /**
     * Log work order deletion
     */
    public void logWorkOrderDeleted(String workOrderId, String workOrderNumber, Object workOrderData) {
        logSuccess("PRODUCTION", "WORK_ORDER", workOrderId, Operation.DELETE, 
                  "Work order deleted: " + workOrderNumber, workOrderData, null);
    }
    
    /**
     * Log work order release
     */
    public void logWorkOrderReleased(String workOrderId, String workOrderNumber, Object workOrderData) {
        logSuccess("PRODUCTION", "WORK_ORDER", workOrderId, Operation.RELEASE, 
                  "Work order released: " + workOrderNumber, null, workOrderData);
    }
    
    /**
     * Log work order completion
     */
    public void logWorkOrderCompleted(String workOrderId, String workOrderNumber, Integer completedQuantity, Object workOrderData) {
        logSuccess("PRODUCTION", "WORK_ORDER", workOrderId, Operation.COMPLETE, 
                  "Work order completed: " + workOrderNumber + " (Qty: " + completedQuantity + ")", null, workOrderData);
    }
    
    /**
     * Log work order cancellation
     */
    public void logWorkOrderCancelled(String workOrderId, String workOrderNumber, Object workOrderData) {
        logSuccess("PRODUCTION", "WORK_ORDER", workOrderId, Operation.CANCEL, 
                  "Work order cancelled: " + workOrderNumber, null, workOrderData);
    }
    
    /**
     * Log work order hold
     */
    public void logWorkOrderHeld(String workOrderId, String workOrderNumber, Object workOrderData) {
        logSuccess("PRODUCTION", "WORK_ORDER", workOrderId, Operation.HOLD, 
                  "Work order held: " + workOrderNumber, null, workOrderData);
    }
    
    /**
     * Log work order resume
     */
    public void logWorkOrderResumed(String workOrderId, String workOrderNumber, Object workOrderData) {
        logSuccess("PRODUCTION", "WORK_ORDER", workOrderId, Operation.RESUME, 
                  "Work order resumed: " + workOrderNumber, null, workOrderData);
    }
    
    /**
     * Log WIP movement
     */
    public void logWIPMoved(String workOrderId, String fromOperation, String toOperation, Object wipData) {
        logSuccess("PRODUCTION", "WIP", workOrderId, Operation.MOVE, 
                  "WIP moved from " + fromOperation + " to " + toOperation, null, wipData);
    }
    
    /**
     * Log WIP hold
     */
    public void logWIPHeld(String workOrderId, String operation, Object wipData) {
        logSuccess("PRODUCTION", "WIP", workOrderId, Operation.HOLD, 
                  "WIP held at operation: " + operation, null, wipData);
    }
    
    /**
     * Log WIP release
     */
    public void logWIPReleased(String workOrderId, String operation, Object wipData) {
        logSuccess("PRODUCTION", "WIP", workOrderId, Operation.RELEASE, 
                  "WIP released from operation: " + operation, null, wipData);
    }
    
    /**
     * Log routing creation
     */
    public void logRoutingCreated(String routingId, String routingCode, Object routingData) {
        logSuccess("PRODUCTION", "ROUTING", routingId, Operation.CREATE, 
                  "Routing created: " + routingCode, null, routingData);
    }
    
    /**
     * Log routing update
     */
    public void logRoutingUpdated(String routingId, String routingCode, Object oldData, Object newData) {
        logSuccess("PRODUCTION", "ROUTING", routingId, Operation.UPDATE, 
                  "Routing updated: " + routingCode, oldData, newData);
    }
    
    /**
     * Log routing deletion
     */
    public void logRoutingDeleted(String routingId, String routingCode, Object routingData) {
        logSuccess("PRODUCTION", "ROUTING", routingId, Operation.DELETE, 
                  "Routing deleted: " + routingCode, routingData, null);
    }
    
    /**
     * Log operation creation
     */
    public void logOperationCreated(String operationId, String operationName, Object operationData) {
        logSuccess("PRODUCTION", "OPERATION", operationId, Operation.CREATE, 
                  "Operation created: " + operationName, null, operationData);
    }
    
    /**
     * Log operation update
     */
    public void logOperationUpdated(String operationId, String operationName, Object oldData, Object newData) {
        logSuccess("PRODUCTION", "OPERATION", operationId, Operation.UPDATE, 
                  "Operation updated: " + operationName, oldData, newData);
    }
    
    /**
     * Log operation deletion
     */
    public void logOperationDeleted(String operationId, String operationName, Object operationData) {
        logSuccess("PRODUCTION", "OPERATION", operationId, Operation.DELETE, 
                  "Operation deleted: " + operationName, operationData, null);
    }
    
    /**
     * Log capacity update
     */
    public void logCapacityUpdated(String machineId, String machineName, Object oldData, Object newData) {
        logSuccess("PRODUCTION", "CAPACITY", machineId, Operation.UPDATE, 
                  "Capacity updated for machine: " + machineName, oldData, newData);
    }
    
    /**
     * Log production permission denied
     */
    public void logProductionPermissionDenied(String module, String entityType, String entityId,
                                             Operation operation, String description) {
        logPermissionDenied(module, entityType, entityId, operation, description);
    }
    
    /**
     * Log production system error
     */
    public void logProductionSystemError(String module, String entityType, String entityId,
                                       Operation operation, String description, String errorMessage) {
        logSystemError(module, entityType, entityId, operation, description, errorMessage);
    }
}