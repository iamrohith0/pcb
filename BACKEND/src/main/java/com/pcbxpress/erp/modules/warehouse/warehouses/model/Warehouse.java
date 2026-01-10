package com.pcbxpress.erp.modules.warehouse.warehouses.model;

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
 * Warehouse Entity
 * Represents a physical warehouse for storing inventory
 */
@Entity
@Table(name = "warehouses", indexes = {
    @Index(name = "idx_warehouses_code", columnList = "code"),
    @Index(name = "idx_warehouses_name", columnList = "name"),
    @Index(name = "idx_warehouses_plant_id", columnList = "plant_id"),
    @Index(name = "idx_warehouses_status", columnList = "status"),
    @Index(name = "idx_warehouses_is_default", columnList = "is_default"),
    @Index(name = "idx_warehouses_created_at", columnList = "created_at"),
    @Index(name = "idx_warehouses_updated_at", columnList = "updated_at")
})
public class Warehouse {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String code;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Column(name = "warehouse_type", length = 50)
    @Enumerated(EnumType.STRING)
    private WarehouseType warehouseType;
    
    @Column(name = "plant_id")
    private UUID plantId;
    
    @Column(name = "plant_name", length = 100)
    private String plantName;
    
    @Column(name = "is_default", nullable = false)
    private boolean isDefault;
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive;
    
    // Address fields
    @Column(name = "address_line1", length = 200)
    private String addressLine1;
    
    @Column(name = "address_line2", length = 200)
    private String addressLine2;
    
    @Column(length = 100)
    private String city;
    
    @Column(length = 100)
    private String state;
    
    @Column(length = 20)
    private String pincode;
    
    @Column(length = 100)
    private String country;
    
    // Contact information
    @Column(name = "contact_name", length = 100)
    private String contactName;
    
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;
    
    // Capacity and dimensions
    @Column(name = "total_capacity", precision = 15, scale = 3)
    private BigDecimal totalCapacity;
    
    @Column(name = "used_capacity", precision = 15, scale = 3)
    private BigDecimal usedCapacity;
    
    @Column(name = "capacity_unit", length = 20)
    private String capacityUnit;
    
    @Column(name = "area_sqm", precision = 15, scale = 3)
    private BigDecimal areaSqM;
    
    // Operational flags
    @Column(name = "supports_serialization", nullable = false)
    private boolean supportsSerialization;
    
    @Column(name = "supports_lot_tracking", nullable = false)
    private boolean supportsLotTracking;
    
    @Column(name = "supports_bulk_storage", nullable = false)
    private boolean supportsBulkStorage;
    
    @Column(name = "supports_temperature_control", nullable = false)
    private boolean supportsTemperatureControl;
    
    @Column(name = "temperature_range", length = 50)
    private String temperatureRange;
    
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
    
    public WarehouseType getWarehouseType() {
        return warehouseType;
    }
    
    public void setWarehouseType(WarehouseType warehouseType) {
        this.warehouseType = warehouseType;
    }
    
    public UUID getPlantId() {
        return plantId;
    }
    
    public void setPlantId(UUID plantId) {
        this.plantId = plantId;
    }
    
    public String getPlantName() {
        return plantName;
    }
    
    public void setPlantName(String plantName) {
        this.plantName = plantName;
    }
    
    public boolean isDefault() {
        return isDefault;
    }
    
    public void setDefault(boolean isDefault) {
        this.isDefault = isDefault;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    public String getAddressLine1() {
        return addressLine1;
    }
    
    public void setAddressLine1(String addressLine1) {
        this.addressLine1 = addressLine1;
    }
    
    public String getAddressLine2() {
        return addressLine2;
    }
    
    public void setAddressLine2(String addressLine2) {
        this.addressLine2 = addressLine2;
    }
    
    public String getCity() {
        return city;
    }
    
    public void setCity(String city) {
        this.city = city;
    }
    
    public String getState() {
        return state;
    }
    
    public void setState(String state) {
        this.state = state;
    }
    
    public String getPincode() {
        return pincode;
    }
    
    public void setPincode(String pincode) {
        this.pincode = pincode;
    }
    
    public String getCountry() {
        return country;
    }
    
    public void setCountry(String country) {
        this.country = country;
    }
    
    public String getContactName() {
        return contactName;
    }
    
    public void setContactName(String contactName) {
        this.contactName = contactName;
    }
    
    public String getContactPhone() {
        return contactPhone;
    }
    
    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
    
    public BigDecimal getTotalCapacity() {
        return totalCapacity;
    }
    
    public void setTotalCapacity(BigDecimal totalCapacity) {
        this.totalCapacity = totalCapacity;
    }
    
    public BigDecimal getUsedCapacity() {
        return usedCapacity;
    }
    
    public void setUsedCapacity(BigDecimal usedCapacity) {
        this.usedCapacity = usedCapacity;
    }
    
    public String getCapacityUnit() {
        return capacityUnit;
    }
    
    public void setCapacityUnit(String capacityUnit) {
        this.capacityUnit = capacityUnit;
    }
    
    public BigDecimal getAreaSqM() {
        return areaSqM;
    }
    
    public void setAreaSqM(BigDecimal areaSqM) {
        this.areaSqM = areaSqM;
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
    
    public boolean isSupportsBulkStorage() {
        return supportsBulkStorage;
    }
    
    public void setSupportsBulkStorage(boolean supportsBulkStorage) {
        this.supportsBulkStorage = supportsBulkStorage;
    }
    
    public boolean isSupportsTemperatureControl() {
        return supportsTemperatureControl;
    }
    
    public void setSupportsTemperatureControl(boolean supportsTemperatureControl) {
        this.supportsTemperatureControl = supportsTemperatureControl;
    }
    
    public String getTemperatureRange() {
        return temperatureRange;
    }
    
    public void setTemperatureRange(String temperatureRange) {
        this.temperatureRange = temperatureRange;
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
    
    public enum WarehouseType {
        RAW_MATERIAL,
        FINISHED_GOODS,
        WIP,
        DISPATCH,
        RECEIVING,
        QUARANTINE,
        REWORK,
        SCRAP
    }
}