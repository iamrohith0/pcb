package com.pcbxpress.erp.modules.sales.customer.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.net.InetAddress;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "customer_audit_log", indexes = {
    @Index(name = "idx_customer_audit_log_customer_id", columnList = "customer_id"),
    @Index(name = "idx_customer_audit_log_action", columnList = "action"),
    @Index(name = "idx_customer_audit_log_created_at", columnList = "created_at")
})
public class CustomerAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "changed_fields", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode changedFields;

    @Column(name = "old_values", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode oldValues;

    @Column(name = "new_values", columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private JsonNode newValues;

    @Column(name = "changed_by", length = 150)
    private String changedBy;

    @Column(name = "ip_address", columnDefinition = "inet")
    @JdbcTypeCode(SqlTypes.INET)
    private InetAddress ipAddress;

    @Column(name = "user_agent", columnDefinition = "text")
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    // Constructors
    public CustomerAuditLog() {
        this.createdAt = OffsetDateTime.now();
    }

    public CustomerAuditLog(UUID customerId, String action, JsonNode changedFields,
                           JsonNode oldValues, JsonNode newValues, String changedBy,
                           InetAddress ipAddress, String userAgent) {
        this();
        this.customerId = customerId;
        this.action = action;
        this.changedFields = changedFields;
        this.oldValues = oldValues;
        this.newValues = newValues;
        this.changedBy = changedBy;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public JsonNode getChangedFields() {
        return changedFields;
    }

    public void setChangedFields(JsonNode changedFields) {
        this.changedFields = changedFields;
    }

    public JsonNode getOldValues() {
        return oldValues;
    }

    public void setOldValues(JsonNode oldValues) {
        this.oldValues = oldValues;
    }

    public JsonNode getNewValues() {
        return newValues;
    }

    public void setNewValues(JsonNode newValues) {
        this.newValues = newValues;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public InetAddress getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(InetAddress ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
