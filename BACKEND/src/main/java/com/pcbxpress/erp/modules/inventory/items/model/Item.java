package com.pcbxpress.erp.modules.inventory.items.model;

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
 * Inventory Item Entity
 * Represents a product or material in inventory
 */
@Entity
@Table(name = "inventory_items", indexes = {
    @Index(name = "idx_items_code", columnList = "item_code"),
    @Index(name = "idx_items_name", columnList = "name"),
    @Index(name = "idx_items_category", columnList = "category"),
    @Index(name = "idx_items_status", columnList = "status"),
    @Index(name = "idx_items_sku", columnList = "sku"),
    @Index(name = "idx_items_created_at", columnList = "created_at"),
    @Index(name = "idx_items_updated_at", columnList = "updated_at")
})
public class Item {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "item_code", nullable = false, unique = true, length = 50)
    private String itemCode;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(length = 500)
    private String description;
    
    @Column(name = "sku", length = 100)
    private String sku;
    
    @Column(name = "category", length = 100)
    private String category;
    
    @Column(name = "subcategory", length = 100)
    private String subcategory;
    
    @Column(name = "item_type", length = 50)
    @Enumerated(EnumType.STRING)
    private ItemType itemType;
    
    @Column(name = "unit_of_measure", length = 20)
    private String unitOfMeasure;
    
    @Column(name = "reorder_level")
    private Integer reorderLevel;
    
    @Column(name = "reorder_quantity")
    private Integer reorderQuantity;
    
    @Column(name = "min_stock_level")
    private Integer minStockLevel;
    
    @Column(name = "max_stock_level")
    private Integer maxStockLevel;
    
    @Column(name = "cost_price", precision = 15, scale = 2)
    private BigDecimal costPrice;
    
    @Column(name = "selling_price", precision = 15, scale = 2)
    private BigDecimal sellingPrice;
    
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
    
    @Column(name = "is_serialized", nullable = false)
    private boolean isSerialized;
    
    @Column(name = "is_lot_tracked", nullable = false)
    private boolean isLotTracked;
    
    @Column(name = "shelf_life_days")
    private Integer shelfLifeDays;
    
    @Column(name = "hazardous_material", nullable = false)
    private boolean hazardousMaterial;
    
    @Column(name = "storage_conditions", length = 200)
    private String storageConditions;
    
    @Column(name = "supplier_part_number", length = 100)
    private String supplierPartNumber;
    
    @Column(name = "manufacturer", length = 100)
    private String manufacturer;
    
    @Column(name = "manufacturer_part_number", length = 100)
    private String manufacturerPartNumber;
    
    @Column(name = "barcode", length = 100)
    private String barcode;
    
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
    
    public String getItemCode() {
        return itemCode;
    }
    
    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
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
    
    public String getSku() {
        return sku;
    }
    
    public void setSku(String sku) {
        this.sku = sku;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getSubcategory() {
        return subcategory;
    }
    
    public void setSubcategory(String subcategory) {
        this.subcategory = subcategory;
    }
    
    public ItemType getItemType() {
        return itemType;
    }
    
    public void setItemType(ItemType itemType) {
        this.itemType = itemType;
    }
    
    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }
    
    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }
    
    public Integer getReorderLevel() {
        return reorderLevel;
    }
    
    public void setReorderLevel(Integer reorderLevel) {
        this.reorderLevel = reorderLevel;
    }
    
    public Integer getReorderQuantity() {
        return reorderQuantity;
    }
    
    public void setReorderQuantity(Integer reorderQuantity) {
        this.reorderQuantity = reorderQuantity;
    }
    
    public Integer getMinStockLevel() {
        return minStockLevel;
    }
    
    public void setMinStockLevel(Integer minStockLevel) {
        this.minStockLevel = minStockLevel;
    }
    
    public Integer getMaxStockLevel() {
        return maxStockLevel;
    }
    
    public void setMaxStockLevel(Integer maxStockLevel) {
        this.maxStockLevel = maxStockLevel;
    }
    
    public BigDecimal getCostPrice() {
        return costPrice;
    }
    
    public void setCostPrice(BigDecimal costPrice) {
        this.costPrice = costPrice;
    }
    
    public BigDecimal getSellingPrice() {
        return sellingPrice;
    }
    
    public void setSellingPrice(BigDecimal sellingPrice) {
        this.sellingPrice = sellingPrice;
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
    
    public boolean isSerialized() {
        return isSerialized;
    }
    
    public void setSerialized(boolean serialized) {
        isSerialized = serialized;
    }
    
    public boolean isLotTracked() {
        return isLotTracked;
    }
    
    public void setLotTracked(boolean lotTracked) {
        isLotTracked = lotTracked;
    }
    
    public Integer getShelfLifeDays() {
        return shelfLifeDays;
    }
    
    public void setShelfLifeDays(Integer shelfLifeDays) {
        this.shelfLifeDays = shelfLifeDays;
    }
    
    public boolean isHazardousMaterial() {
        return hazardousMaterial;
    }
    
    public void setHazardousMaterial(boolean hazardousMaterial) {
        this.hazardousMaterial = hazardousMaterial;
    }
    
    public String getStorageConditions() {
        return storageConditions;
    }
    
    public void setStorageConditions(String storageConditions) {
        this.storageConditions = storageConditions;
    }
    
    public String getSupplierPartNumber() {
        return supplierPartNumber;
    }
    
    public void setSupplierPartNumber(String supplierPartNumber) {
        this.supplierPartNumber = supplierPartNumber;
    }
    
    public String getManufacturer() {
        return manufacturer;
    }
    
    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }
    
    public String getManufacturerPartNumber() {
        return manufacturerPartNumber;
    }
    
    public void setManufacturerPartNumber(String manufacturerPartNumber) {
        this.manufacturerPartNumber = manufacturerPartNumber;
    }
    
    public String getBarcode() {
        return barcode;
    }
    
    public void setBarcode(String barcode) {
        this.barcode = barcode;
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
    
    public enum ItemType {
        RAW_MATERIAL,
        COMPONENT,
        FINISHED_GOODS,
        SUB_ASSEMBLY,
        PACKAGING,
        TOOLS,
        CONSUMABLES
    }
}