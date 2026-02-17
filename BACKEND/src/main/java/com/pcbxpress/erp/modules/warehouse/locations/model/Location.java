package com.pcbxpress.erp.modules.warehouse.locations.model;

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
 * Location Entity
 * Represents a specific storage location within a warehouse (bin, rack, shelf,
 * etc.)
 */
@Entity
@Table(name = "locations", indexes = {
        @Index(name = "idx_locations_code", columnList = "code"),
        @Index(name = "idx_locations_warehouse_id", columnList = "warehouse_id"),
        @Index(name = "idx_locations_type", columnList = "location_type"),
        @Index(name = "idx_locations_status", columnList = "status"),
        @Index(name = "idx_locations_zone", columnList = "zone"),
        @Index(name = "idx_locations_aisle", columnList = "aisle"),
        @Index(name = "idx_locations_rack", columnList = "rack"),
        @Index(name = "idx_locations_shelf", columnList = "shelf"),
        @Index(name = "idx_locations_bin", columnList = "bin"),
        @Index(name = "idx_locations_created_at", columnList = "created_at"),
        @Index(name = "idx_locations_updated_at", columnList = "updated_at")
})
public class Location {

    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;

    @Column(name = "warehouse_name", length = 200)
    private String warehouseName;

    @Column(name = "location_type", length = 50)
    @Enumerated(EnumType.STRING)
    private LocationType locationType;

    @Column(name = "is_active", nullable = false)
    private boolean isActive;

    // Location hierarchy/path
    @Column(length = 50)
    private String zone;

    @Column(length = 50)
    private String aisle;

    @Column(length = 50)
    private String rack;

    @Column(length = 50)
    private String shelf;

    @Column(length = 50)
    private String bin;

    // Physical dimensions and capacity
    @Column(name = "max_capacity", precision = 15, scale = 3)
    private BigDecimal maxCapacity;

    @Column(name = "current_capacity", precision = 15, scale = 3)
    private BigDecimal currentCapacity;

    @Column(name = "capacity_unit", length = 20)
    private String capacityUnit;

    @Column(name = "length", precision = 10, scale = 3)
    private BigDecimal length;

    @Column(name = "width", precision = 10, scale = 3)
    private BigDecimal width;

    @Column(name = "height", precision = 10, scale = 3)
    private BigDecimal height;

    @Column(name = "volume", precision = 15, scale = 3)
    private BigDecimal volume;

    // Status and restrictions
    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING)
    private LocationStatus status;

    @Column(name = "is_locked", nullable = false)
    private boolean isLocked;

    @Column(name = "is_quarantine", nullable = false)
    private boolean isQuarantine;

    @Column(name = "is_bulk_storage", nullable = false)
    private boolean isBulkStorage;

    @Column(name = "supports_serialization", nullable = false)
    private boolean supportsSerialization;

    @Column(name = "supports_lot_tracking", nullable = false)
    private boolean supportsLotTracking;

    // Restrictions
    @Column(name = "restricted_item_types", length = 500)
    private String restrictedItemTypes;

    @Column(name = "max_items_per_location")
    private Integer maxItemsPerLocation;

    // Audit fields
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

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public LocationType getLocationType() {
        return locationType;
    }

    public void setLocationType(LocationType locationType) {
        this.locationType = locationType;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public String getZone() {
        return zone;
    }

    public void setZone(String zone) {
        this.zone = zone;
    }

    public String getAisle() {
        return aisle;
    }

    public void setAisle(String aisle) {
        this.aisle = aisle;
    }

    public String getRack() {
        return rack;
    }

    public void setRack(String rack) {
        this.rack = rack;
    }

    public String getShelf() {
        return shelf;
    }

    public void setShelf(String shelf) {
        this.shelf = shelf;
    }

    public String getBin() {
        return bin;
    }

    public void setBin(String bin) {
        this.bin = bin;
    }

    public BigDecimal getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(BigDecimal maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public BigDecimal getCurrentCapacity() {
        return currentCapacity;
    }

    public void setCurrentCapacity(BigDecimal currentCapacity) {
        this.currentCapacity = currentCapacity;
    }

    public String getCapacityUnit() {
        return capacityUnit;
    }

    public void setCapacityUnit(String capacityUnit) {
        this.capacityUnit = capacityUnit;
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

    public LocationStatus getStatus() {
        return status;
    }

    public void setStatus(LocationStatus status) {
        this.status = status;
    }

    public boolean isLocked() {
        return isLocked;
    }

    public void setLocked(boolean locked) {
        isLocked = locked;
    }

    public boolean isQuarantine() {
        return isQuarantine;
    }

    public void setQuarantine(boolean quarantine) {
        isQuarantine = quarantine;
    }

    public boolean isBulkStorage() {
        return isBulkStorage;
    }

    public void setBulkStorage(boolean bulkStorage) {
        isBulkStorage = bulkStorage;
    }

    public boolean isSupportsSerialization() {
        return supportsSerialization;
    }

    public void setSupportsSerialization(boolean supportsSerialization) {
        this.supportsSerialization = supportsSerialization;
    }

    public boolean isSupportsLotTracking() {
        return supportsLotTracking;
    }

    public void setSupportsLotTracking(boolean supportsLotTracking) {
        this.supportsLotTracking = supportsLotTracking;
    }

    public String getRestrictedItemTypes() {
        return restrictedItemTypes;
    }

    public void setRestrictedItemTypes(String restrictedItemTypes) {
        this.restrictedItemTypes = restrictedItemTypes;
    }

    public Integer getMaxItemsPerLocation() {
        return maxItemsPerLocation;
    }

    public void setMaxItemsPerLocation(Integer maxItemsPerLocation) {
        this.maxItemsPerLocation = maxItemsPerLocation;
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

    public enum LocationType {
        BIN,
        SHELF,
        RACK,
        PALLET,
        FLOOR,
        CAGE,
        CONTAINER,
        TOTE
    }

    public enum LocationStatus {
        AVAILABLE,
        OCCUPIED,
        RESERVED,
        MAINTENANCE,
        DISABLED
    }
}