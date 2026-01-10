package com.pcbxpress.erp.modules.admin.masters.model;

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
 * Material Master Entity for Admin Module
 * Represents a material specification for PCB manufacturing
 */
@Entity
@Table(name = "admin_material_master", indexes = {
    @Index(name = "idx_material_code", columnList = "material_code"),
    @Index(name = "idx_material_name", columnList = "name"),
    @Index(name = "idx_material_type", columnList = "material_type"),
    @Index(name = "idx_material_status", columnList = "status"),
    @Index(name = "idx_material_vendor", columnList = "preferred_vendor"),
    @Index(name = "idx_material_created_at", columnList = "created_at"),
    @Index(name = "idx_material_updated_at", columnList = "updated_at")
})
public class MaterialMaster {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "material_code", nullable = false, unique = true, length = 100)
    private String materialCode;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(columnDefinition = "text")
    private String description;
    
    @Column(name = "material_type", nullable = false, length = 100)
    @Enumerated(EnumType.STRING)
    private MaterialType materialType;
    
    @Column(name = "unit_of_measure", nullable = false, length = 20)
    private String unitOfMeasure;
    
    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Status status;
    
    // Specifications
    @Column(name = "thickness_mm", precision = 10, scale = 3)
    private BigDecimal thicknessMm;
    
    @Column(name = "copper_oz", precision = 5, scale = 2)
    private BigDecimal copperOz;
    
    @Column(name = "tg", precision = 5, scale = 1)
    private BigDecimal tg;
    
    @Column(name = "material_class", length = 100)
    private String materialClass;
    
    @Column(name = "finish", length = 100)
    private String finish;
    
    @Column(name = "color", length = 50)
    private String color;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    // Vendor Information
    @Column(name = "preferred_vendor", length = 200)
    private String preferredVendor;
    
    @Column(name = "vendor_part_no", length = 100)
    private String vendorPartNo;
    
    @Column(name = "lead_time_days")
    private Integer leadTimeDays;
    
    // Inventory Settings
    @Column(name = "min_stock", precision = 10, scale = 3)
    private BigDecimal minStock;
    
    @Column(name = "reorder_point", precision = 10, scale = 3)
    private BigDecimal reorderPoint;
    
    // Pricing
    @Column(name = "currency", length = 3)
    private String currency;
    
    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;
    
    // Compliance
    @Column(name = "is_rohs", nullable = false)
    private boolean isRoHS;
    
    @Column(name = "is_reach", nullable = false)
    private boolean isReach;
    
    @Column(name = "is_ul", nullable = false)
    private boolean isUl;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        
        // Set default values
        if (status == null) {
            status = Status.ACTIVE;
        }
        if (currency == null) {
            currency = "INR";
        }
        if (isRoHS == false) {
            isRoHS = true; // Default to RoHS compliant
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
    
    public String getMaterialCode() {
        return materialCode;
    }
    
    public void setMaterialCode(String materialCode) {
        this.materialCode = materialCode;
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
    
    public MaterialType getMaterialType() {
        return materialType;
    }
    
    public void setMaterialType(MaterialType materialType) {
        this.materialType = materialType;
    }
    
    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }
    
    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }
    
    public Status getStatus() {
        return status;
    }
    
    public void setStatus(Status status) {
        this.status = status;
    }
    
    public BigDecimal getThicknessMm() {
        return thicknessMm;
    }
    
    public void setThicknessMm(BigDecimal thicknessMm) {
        this.thicknessMm = thicknessMm;
    }
    
    public BigDecimal getCopperOz() {
        return copperOz;
    }
    
    public void setCopperOz(BigDecimal copperOz) {
        this.copperOz = copperOz;
    }
    
    public BigDecimal getTg() {
        return tg;
    }
    
    public void setTg(BigDecimal tg) {
        this.tg = tg;
    }
    
    public String getMaterialClass() {
        return materialClass;
    }
    
    public void setMaterialClass(String materialClass) {
        this.materialClass = materialClass;
    }
    
    public String getFinish() {
        return finish;
    }
    
    public void setFinish(String finish) {
        this.finish = finish;
    }
    
    public String getColor() {
        return color;
    }
    
    public void setColor(String color) {
        this.color = color;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public String getPreferredVendor() {
        return preferredVendor;
    }
    
    public void setPreferredVendor(String preferredVendor) {
        this.preferredVendor = preferredVendor;
    }
    
    public String getVendorPartNo() {
        return vendorPartNo;
    }
    
    public void setVendorPartNo(String vendorPartNo) {
        this.vendorPartNo = vendorPartNo;
    }
    
    public Integer getLeadTimeDays() {
        return leadTimeDays;
    }
    
    public void setLeadTimeDays(Integer leadTimeDays) {
        this.leadTimeDays = leadTimeDays;
    }
    
    public BigDecimal getMinStock() {
        return minStock;
    }
    
    public void setMinStock(BigDecimal minStock) {
        this.minStock = minStock;
    }
    
    public BigDecimal getReorderPoint() {
        return reorderPoint;
    }
    
    public void setReorderPoint(BigDecimal reorderPoint) {
        this.reorderPoint = reorderPoint;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public BigDecimal getUnitPrice() {
        return unitPrice;
    }
    
    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
    
    public boolean isRoHS() {
        return isRoHS;
    }
    
    public void setRoHS(boolean roHS) {
        isRoHS = roHS;
    }
    
    public boolean isReach() {
        return isReach;
    }
    
    public void setReach(boolean reach) {
        isReach = reach;
    }
    
    public boolean isUl() {
        return isUl;
    }
    
    public void setUl(boolean ul) {
        isUl = ul;
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
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public String getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    public enum MaterialType {
        COPPER_CLAD_LAMINATE,
        PREPREG,
        COPPER_FOIL,
        SOLDER_MASK,
        SILKSCREEN_INK,
        SURFACE_FINISH_CHEMICAL,
        DRILL_BIT,
        TOOLING_CONSUMABLE,
        PACKAGING,
        OTHER
    }
    
    public enum Status {
        ACTIVE,
        INACTIVE,
        OBSOLETE
    }
}