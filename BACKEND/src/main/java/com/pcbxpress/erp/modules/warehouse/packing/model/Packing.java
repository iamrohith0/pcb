package com.pcbxpress.erp.modules.warehouse.packing.model;

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
 * Packing Entity
 * Represents a packing operation for warehouse items
 */
@Entity
@Table(name = "packings", indexes = {
    @Index(name = "idx_packings_code", columnList = "code"),
    @Index(name = "idx_packings_status", columnList = "status"),
    @Index(name = "idx_packings_warehouse_id", columnList = "warehouse_id"),
    @Index(name = "idx_packings_location_id", columnList = "location_id"),
    @Index(name = "idx_packings_item_id", columnList = "item_id"),
    @Index(name = "idx_packings_batch_id", columnList = "batch_id"),
    @Index(name = "idx_packings_serial_id", columnList = "serial_id"),
    @Index(name = "idx_packings_shipment_id", columnList = "shipment_id"),
    @Index(name = "idx_packings_work_order", columnList = "work_order"),
    @Index(name = "idx_packings_pick_list_id", columnList = "pick_list_id"),
    @Index(name = "idx_packings_created_at", columnList = "created_at"),
    @Index(name = "idx_packings_updated_at", columnList = "updated_at")
})
public class Packing {
    
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
    
    @Column(name = "pick_list_id")
    private UUID pickListId;
    
    @Column(name = "pick_list_code", length = 100)
    private String pickListCode;
    
    @Column(name = "customer", length = 200)
    private String customer;
    
    @Column(name = "priority", length = 50)
    @Enumerated(EnumType.STRING)
    private Priority priority;
    
    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING)
    private PackingStatus status;
    
    @Column(name = "quantity_to_pack", precision = 15, scale = 3)
    private BigDecimal quantityToPack;
    
    @Column(name = "quantity_packed", precision = 15, scale = 3)
    private BigDecimal quantityPacked;
    
    @Column(name = "quantity_confirmed", precision = 15, scale = 3)
    private BigDecimal quantityConfirmed;
    
    @Column(name = "unit_of_measure", length = 20)
    private String unitOfMeasure;
    
    @Column(name = "packing_type", length = 50)
    @Enumerated(EnumType.STRING)
    private PackingType packingType;
    
    @Column(name = "carton_type", length = 100)
    private String cartonType;
    
    @Column(name = "carton_code", length = 100)
    private String cartonCode;
    
    @Column(name = "carton_quantity")
    private Integer cartonQuantity;
    
    @Column(name = "weight", precision = 15, scale = 3)
    private BigDecimal weight;
    
    @Column(name = "weight_unit", length = 20)
    private String weightUnit;
    
    @Column(name = "dimensions_length", precision = 10, scale = 3)
    private BigDecimal dimensionsLength;
    
    @Column(name = "dimensions_width", precision = 10, scale = 3)
    private BigDecimal dimensionsWidth;
    
    @Column(name = "dimensions_height", precision = 10, scale = 3)
    private BigDecimal dimensionsHeight;
    
    @Column(name = "dimensions_unit", length = 20)
    private String dimensionsUnit;
    
    @Column(name = "assigned_to", length = 100)
    private String assignedTo;
    
    @Column(name = "packed_by", length = 100)
    private String packedBy;
    
    @Column(name = "confirmed_by", length = 100)
    private String confirmedBy;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    // Audit fields
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @Column(name = "packed_at")
    private OffsetDateTime packedAt;
    
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
    
    public UUID getPickListId() {
        return pickListId;
    }
    
    public void setPickListId(UUID pickListId) {
        this.pickListId = pickListId;
    }
    
    public String getPickListCode() {
        return pickListCode;
    }
    
    public void setPickListCode(String pickListCode) {
        this.pickListCode = pickListCode;
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
    
    public PackingStatus getStatus() {
        return status;
    }
    
    public void setStatus(PackingStatus status) {
        this.status = status;
    }
    
    public BigDecimal getQuantityToPack() {
        return quantityToPack;
    }
    
    public void setQuantityToPack(BigDecimal quantityToPack) {
        this.quantityToPack = quantityToPack;
    }
    
    public BigDecimal getQuantityPacked() {
        return quantityPacked;
    }
    
    public void setQuantityPacked(BigDecimal quantityPacked) {
        this.quantityPacked = quantityPacked;
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
    
    public PackingType getPackingType() {
        return packingType;
    }
    
    public void setPackingType(PackingType packingType) {
        this.packingType = packingType;
    }
    
    public String getCartonType() {
        return cartonType;
    }
    
    public void setCartonType(String cartonType) {
        this.cartonType = cartonType;
    }
    
    public String getCartonCode() {
        return cartonCode;
    }
    
    public void setCartonCode(String cartonCode) {
        this.cartonCode = cartonCode;
    }
    
    public Integer getCartonQuantity() {
        return cartonQuantity;
    }
    
    public void setCartonQuantity(Integer cartonQuantity) {
        this.cartonQuantity = cartonQuantity;
    }
    
    public BigDecimal getWeight() {
        return weight;
    }
    
    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }
    
    public String getWeightUnit() {
        return weightUnit;
    }
    
    public void setWeightUnit(String weightUnit) {
        this.weightUnit = weightUnit;
    }
    
    public BigDecimal getDimensionsLength() {
        return dimensionsLength;
    }
    
    public void setDimensionsLength(BigDecimal dimensionsLength) {
        this.dimensionsLength = dimensionsLength;
    }
    
    public BigDecimal getDimensionsWidth() {
        return dimensionsWidth;
    }
    
    public void setDimensionsWidth(BigDecimal dimensionsWidth) {
        this.dimensionsWidth = dimensionsWidth;
    }
    
    public BigDecimal getDimensionsHeight() {
        return dimensionsHeight;
    }
    
    public void setDimensionsHeight(BigDecimal dimensionsHeight) {
        this.dimensionsHeight = dimensionsHeight;
    }
    
    public String getDimensionsUnit() {
        return dimensionsUnit;
    }
    
    public void setDimensionsUnit(String dimensionsUnit) {
        this.dimensionsUnit = dimensionsUnit;
    }
    
    public String getAssignedTo() {
        return assignedTo;
    }
    
    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }
    
    public String getPackedBy() {
        return packedBy;
    }
    
    public void setPackedBy(String packedBy) {
        this.packedBy = packedBy;
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
    
    public OffsetDateTime getPackedAt() {
        return packedAt;
    }
    
    public void setPackedAt(OffsetDateTime packedAt) {
        this.packedAt = packedAt;
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
    
    public enum PackingStatus {
        DRAFT,
        OPEN,
        PACKING,
        PACKED,
        CONFIRMED,
        CANCELLED
    }
    
    public enum PackingType {
        INDIVIDUAL,
        BATCH,
        CARTON,
        PALLET,
        CUSTOM
    }
}