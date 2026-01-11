package com.pcbxpress.erp.modules.admin.auditlogs.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Audit Log Entity for Admin Module
 * Represents an audit trail entry for system activities
 */
@Entity
@Table(name = "user_audit_log", indexes = {
    @Index(name = "idx_audit_logs_actor", columnList = "user_id"),
    @Index(name = "idx_audit_logs_action", columnList = "action"),
    @Index(name = "idx_audit_logs_entity", columnList = "resource_type"),
    @Index(name = "idx_audit_logs_created_at", columnList = "created_at"),
    @Index(name = "idx_audit_logs_ip", columnList = "ip_address")
})
public class AuditLog {
    
    @Id
    @Column(name = "id", nullable = false, columnDefinition = "bigint")
    private Long id;
    
    @Column(name = "log_id", nullable = false, unique = true, length = 50)
    private String logId;
    
    @Column(name = "timestamp", nullable = false)
    private OffsetDateTime timestamp;
    
    @Column(name = "severity", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Severity severity;
    
    @Column(name = "module", nullable = false, length = 100)
    private String module;
    
    @Column(name = "action", nullable = false, length = 50)
    private String action;
    
    @Column(name = "resource_type", nullable = false, length = 100)
    private String entity;
    
    @Column(name = "resource_id", length = 100)
    private String entityId;
    
    @Column(name = "user_id", columnDefinition = "bigint")
    private Long userId;
    
    @Column(name = "ip_address", length = 50)
    private String ipAddress;
    
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    @Column(name = "message", nullable = false, columnDefinition = "text")
    private String message;
    
    @Column(name = "request_data", columnDefinition = "jsonb")
    private String requestData;
    
    @Column(name = "response_data", columnDefinition = "jsonb")
    private String responseData;
    
    @Column(name = "before_data", columnDefinition = "jsonb")
    private String beforeData;
    
    @Column(name = "after_data", columnDefinition = "jsonb")
    private String afterData;
    
    @Column(name = "session_id", length = 100)
    private String sessionId;
    
    @Column(name = "request_id", length = 100)
    private String requestId;
    
    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
        if (timestamp == null) {
            timestamp = OffsetDateTime.now();
        }
        
        // Generate log ID if not provided
        if (logId == null || logId.isBlank()) {
            logId = "AL-" + String.format("%06d", Math.abs(id.hashCode()) % 1000000);
        }
    }
    
    // Getters and Setters
    
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getLogId() {
        return logId;
    }
    
    public void setLogId(String logId) {
        this.logId = logId;
    }
    
    public OffsetDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(OffsetDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public Severity getSeverity() {
        return severity;
    }
    
    public void setSeverity(Severity severity) {
        this.severity = severity;
    }
    
    public String getModule() {
        return module;
    }
    
    public void setModule(String module) {
        this.module = module;
    }
    
    public String getAction() {
        return action;
    }
    
    public void setAction(String action) {
        this.action = action;
    }
    
    public String getEntity() {
        return entity;
    }
    
    public void setEntity(String entity) {
        this.entity = entity;
    }
    
    public String getEntityId() {
        return entityId;
    }
    
    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public String getRequestData() {
        return requestData;
    }
    
    public void setRequestData(String requestData) {
        this.requestData = requestData;
    }
    
    public String getResponseData() {
        return responseData;
    }
    
    public void setResponseData(String responseData) {
        this.responseData = responseData;
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
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getBeforeData() {
        return beforeData;
    }
    
    public void setBeforeData(String beforeData) {
        this.beforeData = beforeData;
    }
    
    public String getAfterData() {
        return afterData;
    }
    
    public void setAfterData(String afterData) {
        this.afterData = afterData;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public String getRequestId() {
        return requestId;
    }
    
    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }
    
    public String getMetadata() {
        return metadata;
    }
    
    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }
    
    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public enum Severity {
        INFO,
        WARN,
        CRITICAL
    }
}