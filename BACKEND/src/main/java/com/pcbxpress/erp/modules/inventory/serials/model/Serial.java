package com.pcbxpress.erp.modules.inventory.serials.model;

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
 * Serial Entity
 * Represents a unique serial number for traceable items
 */
@Entity
@Table(name = "inventory_serials", indexes = {
    @Index(name = "idx_serials_serial_number", columnList = "serial_number"),
    @Index(name = "idx_serials_item_id", columnList = "item_id"),
    @Index(name = "idx_serials_lot_id", columnList = "lot_id"),
    @Index(name = "idx_serials_work_order_id", columnList = "work_order_id"),
    @Index(name = "idx_serials_status", columnList = "status"),
    @Index(name = "idx_serials_created_at", columnList = "created_at"),
    @Index(name = "idx_serials_updated_at", columnList = "updated_at")
})
public class Serial {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "serial_number", nullable = false, unique = true, length = 100)
    private String serialNumber;
    
    @Column(name = "item_id", nullable = false, columnDefinition = "uuid")
    private UUID itemId;
    
    @Column(name = "lot_id", columnDefinition = "uuid")
    private UUID lotId;
    
    @Column(name = "work_order_id", columnDefinition = "uuid")
    private UUID workOrderId;
    
    @Column(name = "received_date")
    private OffsetDateTime receivedDate;
    
    @Column(name = "manufacture_date")
    private OffsetDateTime manufactureDate;
    
    @Column(name = "expiration_date")
    private OffsetDateTime expirationDate;
    
    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING)
    private SerialStatus status;
    
    @Column(name = "storage_location", length = 200)
    private String storageLocation;
    
    @Column(name = "parent_serial_id", columnDefinition = "uuid")
    private UUID parentSerialId;
    
    @Column(name = "child_serial_ids")
    private String childSerialIds; // Comma-separated list of child serial IDs
    
    @Column(name = "current_location", length = 200)
    private String currentLocation;
    
    @Column(name = "current_warehouse_id", columnDefinition = "uuid")
    private UUID currentWarehouseId;
    
    @Column(name = "current_work_order_id", columnDefinition = "uuid")
    private UUID currentWorkOrderId;
    
    @Column(name = "quality_status", length = 50)
    @Enumerated(EnumType.STRING)
    private QualityStatus qualityStatus;
    
    @Column(name = "quarantine_reason", length = 500)
    private String quarantineReason;
    
    @Column(name = "test_results", columnDefinition = "text")
    private String testResults;
    
    @Column(name = "repair_history", columnDefinition = "text")
    private String repairHistory;
    
    @Column(name = "warranty_expiry_date")
    private OffsetDateTime warrantyExpiryDate;
    
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
    
    public String getSerialNumber() {
        return serialNumber;
    }
    
    public void setSerialNumber(String serialNumber) {
        this.serialNumber = serialNumber;
    }
    
    public UUID getItemId() {
        return itemId;
    }
    
    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }
    
    public UUID getLotId() {
        return lotId;
    }
    
    public void setLotId(UUID lotId) {
        this.lotId = lotId;
    }
    
    public UUID getWorkOrderId() {
        return workOrderId;
    }
    
    public void setWorkOrderId(UUID workOrderId) {
        this.workOrderId = workOrderId;
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
    
    public SerialStatus getStatus() {
        return status;
    }
    
    public void setStatus(SerialStatus status) {
        this.status = status;
    }
    
    public String getStorageLocation() {
        return storageLocation;
    }
    
    public void setStorageLocation(String storageLocation) {
        this.storageLocation = storageLocation;
    }
    
    public UUID getParentSerialId() {
        return parentSerialId;
    }
    
    public void setParentSerialId(UUID parentSerialId) {
        this.parentSerialId = parentSerialId;
    }
    
    public String getChildSerialIds() {
        return childSerialIds;
    }
    
    public void setChildSerialIds(String childSerialIds) {
        this.childSerialIds = childSerialIds;
    }
    
    public String getCurrentLocation() {
        return currentLocation;
    }
    
    public void setCurrentLocation(String currentLocation) {
        this.currentLocation = currentLocation;
    }
    
    public UUID getCurrentWarehouseId() {
        return currentWarehouseId;
    }
    
    public void setCurrentWarehouseId(UUID currentWarehouseId) {
        this.currentWarehouseId = currentWarehouseId;
    }
    
    public UUID getCurrentWorkOrderId() {
        return currentWorkOrderId;
    }
    
    public void setCurrentWorkOrderId(UUID currentWorkOrderId) {
        this.currentWorkOrderId = currentWorkOrderId;
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
    
    public String getTestResults() {
        return testResults;
    }
    
    public void setTestResults(String testResults) {
        this.testResults = testResults;
    }
    
    public String getRepairHistory() {
        return repairHistory;
    }
    
    public void setRepairHistory(String repairHistory) {
        this.repairHistory = repairHistory;
    }
    
    public OffsetDateTime getWarrantyExpiryDate() {
        return warrantyExpiryDate;
    }
    
    public void setWarrantyExpiryDate(OffsetDateTime warrantyExpiryDate) {
        this.warrantyExpiryDate = warrantyExpiryDate;
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
    
    public enum SerialStatus {
        AVAILABLE,
        ASSIGNED,
        IN_USE,
        REPAIRED,
        SCRAPPED,
        EXPIRED,
        QUARANTINE,
        RETURNED
    }
    
    public enum QualityStatus {
        PASSED,
        FAILED,
        PENDING,
        QUARANTINE
    }
}