package com.pcbxpress.erp.modules.inventory.bom.model;

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
 * Bill of Materials (BOM) Entity
 * Represents the components and materials required to manufacture a product
 */
@Entity
@Table(name = "inventory_boms", indexes = {
    @Index(name = "idx_boms_bom_number", columnList = "bom_number"),
    @Index(name = "idx_boms_product_item_id", columnList = "product_item_id"),
    @Index(name = "idx_boms_revision", columnList = "revision"),
    @Index(name = "idx_boms_status", columnList = "status"),
    @Index(name = "idx_boms_effective_date", columnList = "effective_date"),
    @Index(name = "idx_boms_created_at", columnList = "created_at"),
    @Index(name = "idx_boms_updated_at", columnList = "updated_at")
})
public class Bom {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "bom_number", nullable = false, unique = true, length = 100)
    private String bomNumber;
    
    @Column(name = "product_item_id", nullable = false, columnDefinition = "uuid")
    private UUID productItemId;
    
    @Column(name = "revision", length = 20)
    private String revision;
    
    @Column(name = "version", length = 20)
    private String version;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING)
    private BomStatus status;
    
    @Column(name = "effective_date")
    private OffsetDateTime effectiveDate;
    
    @Column(name = "end_date")
    private OffsetDateTime endDate;
    
    @Column(name = "unit_of_measure", length = 20)
    private String unitOfMeasure;
    
    @Column(name = "quantity_per_unit")
    private BigDecimal quantityPerUnit;
    
    @Column(name = "assembly_level")
    private Integer assemblyLevel;
    
    @Column(name = "engineer", length = 100)
    private String engineer;
    
    @Column(name = "approver", length = 100)
    private String approver;
    
    @Column(name = "approved_date")
    private OffsetDateTime approvedDate;
    
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
    
    public String getBomNumber() {
        return bomNumber;
    }
    
    public void setBomNumber(String bomNumber) {
        this.bomNumber = bomNumber;
    }
    
    public UUID getProductItemId() {
        return productItemId;
    }
    
    public void setProductItemId(UUID productItemId) {
        this.productItemId = productItemId;
    }
    
    public String getRevision() {
        return revision;
    }
    
    public void setRevision(String revision) {
        this.revision = revision;
    }
    
    public String getVersion() {
        return version;
    }
    
    public void setVersion(String version) {
        this.version = version;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public BomStatus getStatus() {
        return status;
    }
    
    public void setStatus(BomStatus status) {
        this.status = status;
    }
    
    public OffsetDateTime getEffectiveDate() {
        return effectiveDate;
    }
    
    public void setEffectiveDate(OffsetDateTime effectiveDate) {
        this.effectiveDate = effectiveDate;
    }
    
    public OffsetDateTime getEndDate() {
        return endDate;
    }
    
    public void setEndDate(OffsetDateTime endDate) {
        this.endDate = endDate;
    }
    
    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }
    
    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }
    
    public BigDecimal getQuantityPerUnit() {
        return quantityPerUnit;
    }
    
    public void setQuantityPerUnit(BigDecimal quantityPerUnit) {
        this.quantityPerUnit = quantityPerUnit;
    }
    
    public Integer getAssemblyLevel() {
        return assemblyLevel;
    }
    
    public void setAssemblyLevel(Integer assemblyLevel) {
        this.assemblyLevel = assemblyLevel;
    }
    
    public String getEngineer() {
        return engineer;
    }
    
    public void setEngineer(String engineer) {
        this.engineer = engineer;
    }
    
    public String getApprover() {
        return approver;
    }
    
    public void setApprover(String approver) {
        this.approver = approver;
    }
    
    public OffsetDateTime getApprovedDate() {
        return approvedDate;
    }
    
    public void setApprovedDate(OffsetDateTime approvedDate) {
        this.approvedDate = approvedDate;
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
    
    public enum BomStatus {
        DRAFT,
        PENDING_APPROVAL,
        APPROVED,
        ACTIVE,
        INACTIVE,
        OBSOLETE,
        ARCHIVED
    }
}