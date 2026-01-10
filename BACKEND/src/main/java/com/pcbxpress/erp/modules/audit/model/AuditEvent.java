package com.pcbxpress.erp.modules.audit.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Audit Event Entity
 * Records all significant operations in the system for compliance and tracking
 */
@Entity
@Table(name = "audit_events", indexes = {
    @Index(name = "idx_audit_events_user_id", columnList = "user_id"),
    @Index(name = "idx_audit_events_entity_type", columnList = "entity_type"),
    @Index(name = "idx_audit_events_entity_id", columnList = "entity_id"),
    @Index(name = "idx_audit_events_operation", columnList = "operation"),
    @Index(name = "idx_audit_events_timestamp", columnList = "timestamp"),
    @Index(name = "idx_audit_events_module", columnList = "module")
})
public class AuditEvent {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;
    
    @Column(name = "username", nullable = false, length = 100)
    private String username;
    
    @Column(name = "module", nullable = false, length = 50)
    private String module;
    
    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;
    
    @Column(name = "entity_id", length = 100)
    private String entityId;
    
    @Column(name = "operation", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Operation operation;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "old_values", columnDefinition = "jsonb")
    private String oldValues;
    
    @Column(name = "new_values", columnDefinition = "jsonb")
    private String newValues;
    
    @Column(name = "ip_address", length = 50)
    private String ipAddress;
    
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    @Column(name = "success", nullable = false)
    private boolean success;
    
    @Column(name = "error_message", length = 1000)
    private String errorMessage;
    
    @Column(name = "timestamp", nullable = false)
    private OffsetDateTime timestamp;
    
    @Column(name = "duration_ms")
    private Long durationMs;
    
    // Getters and Setters
    
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getUserId() {
        return userId;
    }
    
    public void setUserId(UUID userId) {
        this.userId = userId;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getModule() {
        return module;
    }
    
    public void setModule(String module) {
        this.module = module;
    }
    
    public String getEntityType() {
        return entityType;
    }
    
    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }
    
    public String getEntityId() {
        return entityId;
    }
    
    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }
    
    public Operation getOperation() {
        return operation;
    }
    
    public void setOperation(Operation operation) {
        this.operation = operation;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getOldValues() {
        return oldValues;
    }
    
    public void setOldValues(String oldValues) {
        this.oldValues = oldValues;
    }
    
    public String getNewValues() {
        return newValues;
    }
    
    public void setNewValues(String newValues) {
        this.newValues = newValues;
    }
    
    public String getIpAddress() {
        return ipAddress;
    }
    
    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }
    
    public String getUserAgent() {
        return userAgent;
    }
    
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
    
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }
    
    public OffsetDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public Long getDurationMs() {
        return durationMs;
    }
    
    public void setDurationMs(Long durationMs) {
        this.durationMs = durationMs;
    }
    
    /**
     * Operation enum defining audit event types
     */
    public enum Operation {
        CREATE,
        READ,
        UPDATE,
        DELETE,
        LOGIN,
        LOGOUT,
        PERMISSION_DENIED,
        SYSTEM_ERROR,
        BATCH_OPERATION,
        IMPORT,
        EXPORT,
        APPROVE,
        REJECT,
        RELEASE,
        COMPLETE,
        CANCEL,
        HOLD,
        RESUME,
        TRANSFER,
        ADJUST,
        MOVE,
        RELEASE_HOLD
    }
}