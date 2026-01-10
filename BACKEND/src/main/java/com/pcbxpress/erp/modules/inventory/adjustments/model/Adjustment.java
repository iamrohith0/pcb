package com.pcbxpress.erp.modules.inventory.adjustments.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Adjustment Entity
 * Represents inventory adjustments (stock corrections, write-offs, etc.)
 */
@Entity
@Table(name = "inventory_adjustments", indexes = {
    @Index(name = "idx_adjustments_adjustment_number", columnList = "adjustment_number"),
    @Index(name = "idx_adjustments_item_id", columnList = "item_id"),
    @Index(name = "idx_adjustments_warehouse_id", columnList = "warehouse_id"),
    @Index(name = "idx_adjustments_lot_id", columnList = "lot_id"),
    @Index(name = "idx_adjustments_serial_id", columnList = "serial_id"),
    @Index(name = "idx_adjustments_status", columnList = "status"),
    @Index(name = "idx_adjustments_type", columnList = "adjustment_type"),
    @Index(name = "idx_adjustments_created_at", columnList = "created_at"),
    @Index(name = "idx_adjustments_updated_at", columnList = "updated_at")
})
public class Adjustment {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "adjustment_number", nullable = false, unique = true, length = 100)
    private String adjustmentNumber;
    
    @Column(name = "item_id", nullable = false, columnDefinition = "uuid")
    private UUID itemId;
    
    @Column(name = "warehouse_id", nullable = false, columnDefinition = "uuid")
    private UUID warehouseId;
    
    @Column(name = "location_id", columnDefinition = "uuid")
    private UUID locationId;
    
    @Column(name = "lot_id", columnDefinition = "uuid")
    private UUID lotId;
    
    @Column(name = "serial_id", columnDefinition = "uuid")
    private UUID serialId;
    
    @Column(name = "adjustment_type", length = 50)
    @Enumerated(EnumType.STRING)
    private AdjustmentType adjustmentType;
    
    @Column(name = "adjustment_reason", length = 200)
    private String adjustmentReason;
    
    @Column(name = "quantity_before")
    private BigDecimal quantityBefore;
    
    @Column(name = "quantity_after")
    private BigDecimal quantityAfter;
    
    @Column(name = "quantity_difference")
    private BigDecimal quantityDifference;
    
    @Column(name = "cost_per_unit", precision = 15, scale = 2)
    private BigDecimal costPerUnit;
    
    @Column(name = "total_value", precision = 15, scale = 2)
    private BigDecimal totalValue;
    
    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING)
    private AdjustmentStatus status;
    
    @Column(name = "approved_by", length = 100)
    private String approvedBy;
    
    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;
    
    @Column(name = "performed_by", length = 100)
    private String performedBy;
    
    @Column(name = "performed_at")
    private OffsetDateTime performedAt;
    
    @Column(name = "reference_document", length = 200)
    private String referenceDocument;
    
    @Column(columnDefinition = "text")
    private String notes;
    
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
        calculateDifference();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
        calculateDifference();
    }
    
    private void calculateDifference() {
        if (quantityBefore != null && quantityAfter != null) {
            this.quantityDifference = quantityAfter.subtract(quantityBefore);
        }
        
        if (quantityDifference != null && costPerUnit != null) {
            this.totalValue = quantityDifference.multiply(costPerUnit);
        }
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getAdjustmentNumber() {
        return adjustmentNumber;
    }
    
    public void setAdjustmentNumber(String adjustmentNumber) {
        this.adjustmentNumber = adjustmentNumber;
    }
    
    public UUID getItemId() {
        return itemId;
    }
    
    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }
    
    public UUID getWarehouseId() {
        return warehouseId;
    }
    
    public void setWarehouseId(UUID warehouseId) {
        this.warehouseId = warehouseId;
    }
    
    public UUID getLocationId() {
        return locationId;
    }
    
    public void setLocationId(UUID locationId) {
        this.locationId = locationId;
    }
    
    public UUID getLotId() {
        return lotId;
    }
    
    public void setLotId(UUID lotId) {
        this.lotId = lotId;
    }
    
    public UUID getSerialId() {
        return serialId;
    }
    
    public void setSerialId(UUID serialId) {
        this.serialId = serialId;
    }
    
    public AdjustmentType getAdjustmentType() {
        return adjustmentType;
    }
    
    public void setAdjustmentType(AdjustmentType adjustmentType) {
        this.adjustmentType = adjustmentType;
    }
    
    public String getAdjustmentReason() {
        return adjustmentReason;
    }
    
    public void setAdjustmentReason(String adjustmentReason) {
        this.adjustmentReason = adjustmentReason;
    }
    
    public BigDecimal getQuantityBefore() {
        return quantityBefore;
    }
    
    public void setQuantityBefore(BigDecimal quantityBefore) {
        this.quantityBefore = quantityBefore;
        calculateDifference();
    }
    
    public BigDecimal getQuantityAfter() {
        return quantityAfter;
    }
    
    public void setQuantityAfter(BigDecimal quantityAfter) {
        this.quantityAfter = quantityAfter;
        calculateDifference();
    }
    
    public BigDecimal getQuantityDifference() {
        return quantityDifference;
    }
    
    public void setQuantityDifference(BigDecimal quantityDifference) {
        this.quantityDifference = quantityDifference;
    }
    
    public BigDecimal getCostPerUnit() {
        return costPerUnit;
    }
    
    public void setCostPerUnit(BigDecimal costPerUnit) {
        this.costPerUnit = costPerUnit;
        calculateDifference();
    }
    
    public BigDecimal getTotalValue() {
        return totalValue;
    }
    
    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }
    
    public AdjustmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(AdjustmentStatus status) {
        this.status = status;
    }
    
    public String getApprovedBy() {
        return approvedBy;
    }
    
    public void setApprovedBy(String approvedBy) {
        this.approvedBy = approvedBy;
    }
    
    public OffsetDateTime getApprovedAt() {
        return approvedAt;
    }
    
    public void setApprovedAt(OffsetDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
    
    public String getPerformedBy() {
        return performedBy;
    }
    
    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }
    
    public OffsetDateTime getPerformedAt() {
        return performedAt;
    }
    
    public void setPerformedAt(OffsetDateTime performedAt) {
        this.performedAt = performedAt;
    }
    
    public String getReferenceDocument() {
        return referenceDocument;
    }
    
    public void setReferenceDocument(String referenceDocument) {
        this.referenceDocument = referenceDocument;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
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
    
    public enum AdjustmentType {
        INCREASE,
        DECREASE,
        WRITE_OFF,
        WRITE_ON,
        TRANSFER_IN,
        TRANSFER_OUT,
        ADJUSTMENT,
        CORRECTION
    }
    
    public enum AdjustmentStatus {
        DRAFT,
        PENDING_APPROVAL,
        APPROVED,
        REJECTED,
        CANCELLED,
        COMPLETED
    }
}