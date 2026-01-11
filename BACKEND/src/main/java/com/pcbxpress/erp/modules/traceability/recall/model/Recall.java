package com.pcbxpress.erp.modules.traceability.recall.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Recall Entity
 * Represents a product recall case for traceability
 */
@Entity
@Table(name = "traceability_recalls", indexes = {
    @Index(name = "idx_recalls_case_number", columnList = "case_number"),
    @Index(name = "idx_recalls_status", columnList = "status"),
    @Index(name = "idx_recalls_product_id", columnList = "product_id"),
    @Index(name = "idx_recalls_batch_id", columnList = "batch_id"),
    @Index(name = "idx_recalls_lot_id", columnList = "lot_id"),
    @Index(name = "idx_recalls_created_at", columnList = "created_at"),
    @Index(name = "idx_recalls_updated_at", columnList = "updated_at")
})
public class Recall {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "case_number", nullable = false, unique = true, length = 100)
    private String caseNumber;
    
    @Column(name = "product_id", columnDefinition = "uuid")
    private UUID productId;
    
    @Column(name = "batch_id", columnDefinition = "uuid")
    private UUID batchId;
    
    @Column(name = "lot_id", columnDefinition = "uuid")
    private UUID lotId;
    
    @Column(name = "recall_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RecallType recallType;
    
    @Column(name = "severity", nullable = false)
    @Enumerated(EnumType.STRING)
    private Severity severity;
    
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private RecallStatus status;
    
    @Column(name = "reason", nullable = false, columnDefinition = "text")
    private String reason;
    
    @Column(name = "description", columnDefinition = "text")
    private String description;
    
    @Column(name = "affected_quantity")
    private Integer affectedQuantity;
    
    @Column(name = "affected_batches", columnDefinition = "text")
    private String affectedBatches;
    
    @Column(name = "affected_lots", columnDefinition = "text")
    private String affectedLots;
    
    @Column(name = "initiated_date", nullable = false)
    private OffsetDateTime initiatedDate;
    
    @Column(name = "effective_date")
    private OffsetDateTime effectiveDate;
    
    @Column(name = "completed_date")
    private OffsetDateTime completedDate;
    
    @Column(name = "initiated_by", length = 200)
    private String initiatedBy;
    
    @Column(name = "approved_by", length = 200)
    private String approvedBy;
    
    @Column(name = "customer_notification_required", nullable = false)
    private boolean customerNotificationRequired;
    
    @Column(name = "regulatory_notification_required", nullable = false)
    private boolean regulatoryNotificationRequired;
    
    @Column(name = "estimated_cost", precision = 15, scale = 2)
    private java.math.BigDecimal estimatedCost;
    
    @Column(name = "actual_cost", precision = 15, scale = 2)
    private java.math.BigDecimal actualCost;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        
        // Set default status if not set
        if (status == null) {
            status = RecallStatus.INITIATED;
        }
        
        // Set default active status
        if (isActive == false) {
            isActive = true;
        }
        
        // Set default dates
        if (initiatedDate == null) {
            initiatedDate = now;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getCaseNumber() {
        return caseNumber;
    }
    
    public void setCaseNumber(String caseNumber) {
        this.caseNumber = caseNumber;
    }
    
    public UUID getProductId() {
        return productId;
    }
    
    public void setProductId(UUID productId) {
        this.productId = productId;
    }
    
    public UUID getBatchId() {
        return batchId;
    }
    
    public void setBatchId(UUID batchId) {
        this.batchId = batchId;
    }
    
    public UUID getLotId() {
        return lotId;
    }
    
    public void setLotId(UUID lotId) {
        this.lotId = lotId;
    }
    
    public RecallType getRecallType() {
        return recallType;
    }
    
    public void setRecallType(RecallType recallType) {
        this.recallType = recallType;
    }
    
    public Severity getSeverity() {
        return severity;
    }
    
    public void setSeverity(Severity severity) {
        this.severity = severity;
    }
    
    public RecallStatus getStatus() {
        return status;
    }
    
    public void setStatus(RecallStatus status) {
        this.status = status;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getAffectedQuantity() {
        return affectedQuantity;
    }
    
    public void setAffectedQuantity(Integer affectedQuantity) {
        this.affectedQuantity = affectedQuantity;
    }
    
    public String getAffectedBatches() {
        return affectedBatches;
    }
    
    public void setAffectedBatches(String affectedBatches) {
        this.affectedBatches = affectedBatches;
    }
    
    public String getAffectedLots() {
        return affectedLots;
    }
    
    public void setAffectedLots(String affectedLots) {
        this.affectedLots = affectedLots;
    }
    
    public OffsetDateTime getInitiatedDate() {
        return initiatedDate;
    }
    
    public void setInitiatedDate(OffsetDateTime initiatedDate) {
        this.initiatedDate = initiatedDate;
    }
    
    public OffsetDateTime getEffectiveDate() {
        return effectiveDate;
    }
    
    public void setEffectiveDate(OffsetDateTime effectiveDate) {
        this.effectiveDate = effectiveDate;
    }
    
    public OffsetDateTime getCompletedDate() {
        return completedDate;
    }
    
    public void setCompletedDate(OffsetDateTime completedDate) {
        this.completedDate = completedDate;
    }
    
    public String getInitiatedBy() {
        return initiatedBy;
    }
    
    public void setInitiatedBy(String initiatedBy) {
        this.initiatedBy = initiatedBy;
    }
    
    public String getApprovedBy() {
        return approvedBy;
    }
    
    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }
    
    public boolean isCustomerNotificationRequired() {
        return customerNotificationRequired;
    }
    
    public void setCustomerNotificationRequired(boolean customerNotificationRequired) {
        this.customerNotificationRequired = customerNotificationRequired;
    }
    
    public boolean isRegulatoryNotificationRequired() {
        return regulatoryNotificationRequired;
    }
    
    public void setRegulatoryNotificationRequired(boolean regulatoryNotificationRequired) {
        this.regulatoryNotificationRequired = regulatoryNotificationRequired;
    }
    
    public java.math.BigDecimal getEstimatedCost() {
        return estimatedCost;
    }
    
    public void setEstimatedCost(java.math.BigDecimal estimatedCost) {
        this.estimatedCost = estimatedCost;
    }
    
    public java.math.BigDecimal getActualCost() {
        return actualCost;
    }
    
    public void setActualCost(java.math.BigDecimal actualCost) {
        this.actualCost = actualCost;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public enum RecallType {
        VOLUNTARY,
        MANDATED,
        CUSTOMER_INITIATED,
        REGULATORY_INITIATED
    }
    
    public enum Severity {
        CLASS_I,    // High risk - serious health consequences
        CLASS_II,   // Moderate risk - temporary health consequences
        CLASS_III,  // Low risk - unlikely to cause health consequences
        MINOR       // Minimal risk
    }
    
    public enum RecallStatus {
        INITIATED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED,
        ON_HOLD
    }
}