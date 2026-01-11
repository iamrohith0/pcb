package com.pcbxpress.erp.modules.traceability.batch.model;

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
import java.time.Period;
import java.util.UUID;

/**
 * Batch Entity
 * Represents a batch of items for traceability tracking
 */
@Entity
@Table(name = "traceability_batches", indexes = {
    @Index(name = "idx_batches_batch_number", columnList = "batch_number"),
    @Index(name = "idx_batches_item_id", columnList = "item_id"),
    @Index(name = "idx_batches_status", columnList = "status"),
    @Index(name = "idx_batches_production_date", columnList = "production_date"),
    @Index(name = "idx_batches_expiry_date", columnList = "expiry_date"),
    @Index(name = "idx_batches_created_at", columnList = "created_at"),
    @Index(name = "idx_batches_updated_at", columnList = "updated_at")
})
public class Batch {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "batch_number", nullable = false, unique = true, length = 100)
    private String batchNumber;
    
    @Column(name = "item_id", nullable = false, columnDefinition = "uuid")
    private UUID itemId;
    
    @Column(name = "production_date", nullable = false)
    private OffsetDateTime productionDate;
    
    @Column(name = "expiry_date")
    private OffsetDateTime expiryDate;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private BatchStatus status;
    
    @Column(name = "location", length = 200)
    private String location;
    
    @Column(name = "warehouse_id", columnDefinition = "uuid")
    private UUID warehouseId;
    
    @Column(name = "supplier_id", columnDefinition = "uuid")
    private UUID supplierId;
    
    @Column(name = "lot_number", length = 100)
    private String lotNumber;
    
    @Column(name = "serial_start")
    private String serialStart;
    
    @Column(name = "serial_end")
    private String serialEnd;
    
    @Column(name = "weight", precision = 10, scale = 3)
    private BigDecimal weight;
    
    @Column(name = "length", precision = 10, scale = 3)
    private BigDecimal length;
    
    @Column(name = "width", precision = 10, scale = 3)
    private BigDecimal width;
    
    @Column(name = "height", precision = 10, scale = 3)
    private BigDecimal height;
    
    @Column(name = "volume", precision = 15, scale = 3)
    private BigDecimal volume;
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive;
    
    @Column(name = "notes", columnDefinition = "text")
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
        
        // Set default status if not set
        if (status == null) {
            status = BatchStatus.ACTIVE;
        }
        
        // Set default active status
        if (isActive == false) {
            isActive = true;
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
    
    public String getBatchNumber() {
        return batchNumber;
    }
    
    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }
    
    public UUID getItemId() {
        return itemId;
    }
    
    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }
    
    public OffsetDateTime getProductionDate() {
        return productionDate;
    }
    
    public void setProductionDate(OffsetDateTime productionDate) {
        this.productionDate = productionDate;
    }
    
    public OffsetDateTime getExpiryDate() {
        return expiryDate;
    }
    
    public void setExpiryDate(OffsetDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
    
    public BatchStatus getStatus() {
        return status;
    }
    
    public void setStatus(BatchStatus status) {
        this.status = status;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public UUID getWarehouseId() {
        return warehouseId;
    }
    
    public void setWarehouseId(UUID warehouseId) {
        this.warehouseId = warehouseId;
    }
    
    public UUID getSupplierId() {
        return supplierId;
    }
    
    public void setSupplierId(UUID supplierId) {
        this.supplierId = supplierId;
    }
    
    public String getLotNumber() {
        return lotNumber;
    }
    
    public void setLotNumber(String lotNumber) {
        this.lotNumber = lotNumber;
    }
    
    public String getSerialStart() {
        return serialStart;
    }
    
    public void setSerialStart(String serialStart) {
        this.serialStart = serialStart;
    }
    
    public String getSerialEnd() {
        return serialEnd;
    }
    
    public void setSerialEnd(String serialEnd) {
        this.serialEnd = serialEnd;
    }
    
    public BigDecimal getWeight() {
        return weight;
    }
    
    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }
    
    public BigDecimal getLength() {
        return length;
    }
    
    public void setLength(BigDecimal length) {
        this.length = length;
    }
    
    public BigDecimal getWidth() {
        return width;
    }
    
    public void setWidth(BigDecimal width) {
        this.width = width;
    }
    
    public BigDecimal getHeight() {
        return height;
    }
    
    public void setHeight(BigDecimal height) {
        this.height = height;
    }
    
    public BigDecimal getVolume() {
        return volume;
    }
    
    public void setVolume(BigDecimal volume) {
        this.volume = volume;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
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
    
    public enum BatchStatus {
        ACTIVE,
        INACTIVE,
        EXPIRED,
        ON_HOLD,
        RECALLED,
        DISPOSED
    }
}