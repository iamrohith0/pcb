package com.pcbxpress.erp.modules.warehouse.picking.model;

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
 * Picking Entity
 * Represents a picking operation for warehouse items
 */
@Entity
@Table(name = "pickings", indexes = {
    @Index(name = "idx_pickings_code", columnList = "code"),
    @Index(name = "idx_pickings_status", columnList = "status"),
    @Index(name = "idx_pickings_warehouse_id", columnList = "warehouse_id"),
    @Index(name = "idx_pickings_location_id", columnList = "location_id"),
    @Index(name = "idx_pickings_item_id", columnList = "item_id"),
    @Index(name = "idx_pickings_batch_id", columnList = "batch_id"),
    @Index(name = "idx_pickings_serial_id", columnList = "serial_id"),
    @Index(name = "idx_pickings_shipment_id", columnList = "shipment_id"),
    @Index(name = "idx_pickings_work_order", columnList = "work_order"),
    @Index(name = "idx_pickings_created_at", columnList = "created_at"),
    @Index(name = "idx_pickings_updated_at", columnList = "updated_at")
})
public class Picking {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String code;
    
    @Column(length = 200)
    private String description;
    
    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;
    
    @Column(name = "warehouse_name", length = 200)
    private String warehouseName;
    
    @Column(name = "location_id")
    private UUID locationId;
    
    @Column(name = "location_code", length = 100)
    private String locationCode;
    
    @Column(name = "location_name", length = 200)
    private String locationName;
    
    @Column(name = "item_id", nullable = false)
    private UUID itemId;
    
    @Column(name = "item_code", length = 50)
    private String itemCode;
    
    @Column(name = "item_name", length = 200)
    private String itemName;
    
    @Column(name = "batch_id")
    private UUID batchId;
    
    @Column(name = "batch_code", length = 100)
    private String batchCode;
    
    @Column(name = "serial_id")
    private UUID serialId;
    
    @Column(name = "serial_code", length = 100)
    private String serialCode;
    
    @Column(name = "shipment_id")
    private UUID shipmentId;
    
    @Column(name = "shipment_code", length = 100)
    private String shipmentCode;
    
    @Column(name = "work_order", length = 100)
    private String workOrder;
    
    @Column(name = "customer", length = 200)
    private String customer;
    
    @Column(name = "priority", length = 50)
    @Enumerated(EnumType.STRING)
    private Priority priority;
    
    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING)
    private PickingStatus status;
    
    @Column(name = "quantity_requested", precision = 15, scale = 3)
    private BigDecimal quantityRequested;
    
    @Column(name = "quantity_picked", precision = 15, scale = 3)
    private BigDecimal quantityPicked;
    
    @Column(name = "quantity_confirmed", precision = 15, scale = 3)
    private BigDecimal quantityConfirmed;
    
    @Column(name = "unit_of_measure", length = 20)
    private String unitOfMeasure;
    
    @Column(name = "picking_type", length = 50)
    @Enumerated(EnumType.STRING)
    private PickingType pickingType;
    
    @Column(name = "assigned_to", length = 100)
    private String assignedTo;
    
    @Column(name = "picked_by", length = 100)
    private String pickedBy;
    
    @Column(name = "confirmed_by", length = 100)
    private String confirmedBy;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    // Audit fields
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @Column(name = "picked_at")
    private OffsetDateTime pickedAt;
    
    @Column(name = "confirmed_at")
    private OffsetDateTime confirmedAt;
    
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
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public UUID getWarehouseId() {
        return warehouseId;
    }
    
    public void setWarehouseId(UUID warehouseId) {
        this.warehouseId = warehouseId;
    }
    
    public String getWarehouseName() {
        return warehouseName;
    }
    
    public void setWarehouseName(String warehouseName) {
        this.warehouseName = warehouseName;
    }
    
    public UUID getLocationId() {
        return locationId;
    }
    
    public void setLocationId(UUID locationId) {
        this.locationId = locationId;
    }
    
    public String getLocationCode() {
        return locationCode;
    }
    
    public void setLocationCode(String locationCode) {
        this.locationCode = locationCode;
    }
    
    public String getLocationName() {
        return locationName;
    }
    
    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }
    
    public UUID getItemId() {
        return itemId;
    }
    
    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }
    
    public String getItemCode() {
        return itemCode;
    }
    
    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }
    
    public String getItemName() {
        return itemName;
    }
    
    public void setItemName(String itemName) {
        this.itemName = itemName;
    }
    
    public UUID getBatchId() {
        return batchId;
    }
    
    public void setBatchId(UUID batchId) {
        this.batchId = batchId;
    }
    
    public String getBatchCode() {
        return batchCode;
    }
    
    public void setBatchCode(String batchCode) {
        this.batchCode = batchCode;
    }
    
    public UUID getSerialId() {
        return serialId;
    }
    
    public void setSerialId(UUID serialId) {
        this.serialId = serialId;
    }
    
    public String getSerialCode() {
        return serialCode;
    }
    
    public void setSerialCode(String serialCode) {
        this.serialCode = serialCode;
    }
    
    public UUID getShipmentId() {
        return shipmentId;
    }
    
    public void setShipmentId(UUID shipmentId) {
        this.shipmentId = shipmentId;
    }
    
    public String getShipmentCode() {
        return shipmentCode;
    }
    
    public void setShipmentCode(String shipmentCode) {
        this.shipmentCode = shipmentCode;
    }
    
    public String getWorkOrder() {
        return workOrder;
    }
    
    public void setWorkOrder(String workOrder) {
        this.workOrder = workOrder;
    }
    
    public String getCustomer() {
        return customer;
    }
    
    public void setCustomer(String customer) {
        this.customer = customer;
    }
    
    public Priority getPriority() {
        return priority;
    }
    
    public void setPriority(Priority priority) {
        this.priority = priority;
    }
    
    public PickingStatus getStatus() {
        return status;
    }
    
    public void setStatus(PickingStatus status) {
        this.status = status;
    }
    
    public BigDecimal getQuantityRequested() {
        return quantityRequested;
    }
    
    public void setQuantityRequested(BigDecimal quantityRequested) {
        this.quantityRequested = quantityRequested;
    }
    
    public BigDecimal getQuantityPicked() {
        return quantityPicked;
    }
    
    public void setQuantityPicked(BigDecimal quantityPicked) {
        this.quantityPicked = quantityPicked;
    }
    
    public BigDecimal getQuantityConfirmed() {
        return quantityConfirmed;
    }
    
    public void setQuantityConfirmed(BigDecimal quantityConfirmed) {
        this.quantityConfirmed = quantityConfirmed;
    }
    
    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }
    
    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }
    
    public PickingType getPickingType() {
        return pickingType;
    }
    
    public void setPickingType(PickingType pickingType) {
        this.pickingType = pickingType;
    }
    
    public String getAssignedTo() {
        return assignedTo;
    }
    
    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }
    
    public String getPickedBy() {
        return pickedBy;
    }
    
    public void setPickedBy(String pickedBy) {
        this.pickedBy = pickedBy;
    }
    
    public String getConfirmedBy() {
        return confirmedBy;
    }
    
    public void setConfirmedBy(String confirmedBy) {
        this.confirmedBy = confirmedBy;
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
    
    public OffsetDateTime getPickedAt() {
        return pickedAt;
    }
    
    public void setPickedAt(OffsetDateTime pickedAt) {
        this.pickedAt = pickedAt;
    }
    
    public OffsetDateTime getConfirmedAt() {
        return confirmedAt;
    }
    
    public void setConfirmedAt(OffsetDateTime confirmedAt) {
        this.confirmedAt = confirmedAt;
    }
    
    public enum Priority {
        LOW,
        NORMAL,
        HIGH,
        URGENT
    }
    
    public enum PickingStatus {
        DRAFT,
        OPEN,
        PICKING,
        PICKED,
        CONFIRMED,
        CANCELLED
    }
    
    public enum PickingType {
        PICK_TO_LIGHT,
        PICK_TO_VOICE,
        PICK_TO_CART,
        MANUAL
    }
}