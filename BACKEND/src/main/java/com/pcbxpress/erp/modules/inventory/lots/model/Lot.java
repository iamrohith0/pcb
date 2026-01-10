package com.pcbxpress.erp.modules.inventory.lots.model;

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
 * Lot Entity
 * Represents a batch of items with shared characteristics and traceability
 */
@Entity
@Table(name = "inventory_lots", indexes = {
    @Index(name = "idx_lots_lot_number", columnList = "lot_number"),
    @Index(name = "idx_lots_item_id", columnList = "item_id"),
    @Index(name = "idx_lots_supplier_id", columnList = "supplier_id"),
    @Index(name = "idx_lots_status", columnList = "status"),
    @Index(name = "idx_lots_created_at", columnList = "created_at"),
    @Index(name = "idx_lots_updated_at", columnList = "updated_at"),
    @Index(name = "idx_lots_expiration_date", columnList = "expiration_date")
})
public class Lot {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "lot_number", nullable = false, unique = true, length = 100)
    private String lotNumber;
    
    @Column(name = "item_id", nullable = false, columnDefinition = "uuid")
    private UUID itemId;
    
    @Column(name = "supplier_id", columnDefinition = "uuid")
    private UUID supplierId;
    
    @Column(name = "received_date")
    private OffsetDateTime receivedDate;
    
    @Column(name = "manufacture_date")
    private OffsetDateTime manufactureDate;
    
    @Column(name = "expiration_date")
    private OffsetDateTime expirationDate;
    
    @Column(name = "quantity_received")
    private BigDecimal quantityReceived;
    
    @Column(name = "quantity_available")
    private BigDecimal quantityAvailable;
    
    @Column(name = "quantity_used")
    private BigDecimal quantityUsed;
    
    @Column(name = "quantity_scrapped")
    private BigDecimal quantityScrapped;
    
    @Column(name = "cost_per_unit", precision = 15, scale = 2)
    private BigDecimal costPerUnit;
    
    @Column(name = "total_cost", precision = 15, scale = 2)
    private BigDecimal totalCost;
    
    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING)
    private LotStatus status;
    
    @Column(name = "storage_location", length = 200)
    private String storageLocation;
    
    @Column(name = "batch_reference", length = 100)
    private String batchReference;
    
    @Column(name = "certificate_of_analysis", length = 200)
    private String certificateOfAnalysis;
    
    @Column(name = "quality_status", length = 50)
    @Enumerated(EnumType.STRING)
    private QualityStatus qualityStatus;
    
    @Column(name = "quarantine_reason", length = 500)
    private String quarantineReason;
    
    @Column(name = "parent_lot_id", columnDefinition = "uuid")
    private UUID parentLotId;
    
    @Column(name = "child_lot_ids")
    private String childLotIds; // Comma-separated list of child lot IDs
    
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
        calculateQuantities();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
        calculateQuantities();
    }
    
    private void calculateQuantities() {
        if (quantityReceived != null) {
            BigDecimal used = quantityUsed != null ? quantityUsed : BigDecimal.ZERO;
            BigDecimal scrapped = quantityScrapped != null ? quantityScrapped : BigDecimal.ZERO;
            this.quantityAvailable = quantityReceived.subtract(used).subtract(scrapped);
        }
        
        if (quantityReceived != null && costPerUnit != null) {
            this.totalCost = quantityReceived.multiply(costPerUnit);
        }
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getLotNumber() {
        return lotNumber;
    }
    
    public void setLotNumber(String lotNumber) {
        this.lotNumber = lotNumber;
    }
    
    public UUID getItemId() {
        return itemId;
    }
    
    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }
    
    public UUID getSupplierId() {
        return supplierId;
    }
    
    public void setSupplierId(UUID supplierId) {
        this.supplierId = supplierId;
    }
    
    public OffsetDateTime getReceivedDate() {
        return receivedDate;
    }
    
    public void setReceivedDate(OffsetDateTime receivedDate) {
        this.receivedDate = receivedDate;
    }
    
    public OffsetDateTime getManufactureDate() {
        return manufactureDate;
    }
    
    public void setManufactureDate(OffsetDateTime manufactureDate) {
        this.manufactureDate = manufactureDate;
    }
    
    public OffsetDateTime getExpirationDate() {
        return expirationDate;
    }
    
    public void setExpirationDate(OffsetDateTime expirationDate) {
        this.expirationDate = expirationDate;
    }
    
    public BigDecimal getQuantityReceived() {
        return quantityReceived;
    }
    
    public void setQuantityReceived(BigDecimal quantityReceived) {
        this.quantityReceived = quantityReceived;
        calculateQuantities();
    }
    
    public BigDecimal getQuantityAvailable() {
        return quantityAvailable;
    }
    
    public void setQuantityAvailable(BigDecimal quantityAvailable) {
        this.quantityAvailable = quantityAvailable;
    }
    
    public BigDecimal getQuantityUsed() {
        return quantityUsed;
    }
    
    public void setQuantityUsed(BigDecimal quantityUsed) {
        this.quantityUsed = quantityUsed;
        calculateQuantities();
    }
    
    public BigDecimal getQuantityScrapped() {
        return quantityScrapped;
    }
    
    public void setQuantityScrapped(BigDecimal quantityScrapped) {
        this.quantityScrapped = quantityScrapped;
        calculateQuantities();
    }
    
    public BigDecimal getCostPerUnit() {
        return costPerUnit;
    }
    
    public void setCostPerUnit(BigDecimal costPerUnit) {
        this.costPerUnit = costPerUnit;
        calculateQuantities();
    }
    
    public BigDecimal getTotalCost() {
        return totalCost;
    }
    
    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
    }
    
    public LotStatus getStatus() {
        return status;
    }
    
    public void setStatus(LotStatus status) {
        this.status = status;
    }
    
    public String getStorageLocation() {
        return storageLocation;
    }
    
    public void setStorageLocation(String storageLocation) {
        this.storageLocation = storageLocation;
    }
    
    public String getBatchReference() {
        return batchReference;
    }
    
    public void setBatchReference(String batchReference) {
        this.batchReference = batchReference;
    }
    
    public String getCertificateOfAnalysis() {
        return certificateOfAnalysis;
    }
    
    public void setCertificateOfAnalysis(String certificateOfAnalysis) {
        this.certificateOfAnalysis = certificateOfAnalysis;
    }
    
    public QualityStatus getQualityStatus() {
        return qualityStatus;
    }
    
    public void setQualityStatus(QualityStatus qualityStatus) {
        this.qualityStatus = qualityStatus;
    }
    
    public String getQuarantineReason() {
        return quarantineReason;
    }
    
    public void setQuarantineReason(String quarantineReason) {
        this.quarantineReason = quarantineReason;
    }
    
    public UUID getParentLotId() {
        return parentLotId;
    }
    
    public void setParentLotId(UUID parentLotId) {
        this.parentLotId = parentLotId;
    }
    
    public String getChildLotIds() {
        return childLotIds;
    }
    
    public void setChildLotIds(String childLotIds) {
        this.childLotIds = childLotIds;
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
    
    public enum LotStatus {
        ACTIVE,
        INACTIVE,
        QUARANTINE,
        EXPIRED,
        SCRAPPED,
        CONSUMED
    }
    
    public enum QualityStatus {
        PASSED,
        FAILED,
        PENDING,
        QUARANTINE
    }
}