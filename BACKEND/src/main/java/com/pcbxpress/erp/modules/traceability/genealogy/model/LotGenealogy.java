package com.pcbxpress.erp.modules.traceability.genealogy.model;

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
 * Lot Genealogy Entity
 * Represents the traceability relationship between lots/components
 */
@Entity
@Table(name = "traceability_lot_genealogy", indexes = {
    @Index(name = "idx_genealogy_parent_lot", columnList = "parent_lot_id"),
    @Index(name = "idx_genealogy_child_lot", columnList = "child_lot_id"),
    @Index(name = "idx_genealogy_component_id", columnList = "component_id"),
    @Index(name = "idx_genealogy_relationship_type", columnList = "relationship_type"),
    @Index(name = "idx_genealogy_created_at", columnList = "created_at"),
    @Index(name = "idx_genealogy_updated_at", columnList = "updated_at")
})
public class LotGenealogy {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "parent_lot_id", nullable = false, columnDefinition = "uuid")
    private UUID parentLotId;
    
    @Column(name = "child_lot_id", nullable = false, columnDefinition = "uuid")
    private UUID childLotId;
    
    @Column(name = "component_id", columnDefinition = "uuid")
    private UUID componentId;
    
    @Column(name = "relationship_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RelationshipType relationshipType;
    
    @Column(name = "quantity_used")
    private Integer quantityUsed;
    
    @Column(name = "unit_of_measure", length = 20)
    private String unitOfMeasure;
    
    @Column(name = "production_date")
    private OffsetDateTime productionDate;
    
    @Column(name = "supplier_id", columnDefinition = "uuid")
    private UUID supplierId;
    
    @Column(name = "warehouse_id", columnDefinition = "uuid")
    private UUID warehouseId;
    
    @Column(name = "location", length = 200)
    private String location;
    
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
    
    public UUID getParentLotId() {
        return parentLotId;
    }
    
    public void setParentLotId(UUID parentLotId) {
        this.parentLotId = parentLotId;
    }
    
    public UUID getChildLotId() {
        return childLotId;
    }
    
    public void setChildLotId(UUID childLotId) {
        this.childLotId = childLotId;
    }
    
    public UUID getComponentId() {
        return componentId;
    }
    
    public void setComponentId(UUID componentId) {
        this.componentId = componentId;
    }
    
    public RelationshipType getRelationshipType() {
        return relationshipType;
    }
    
    public void setRelationshipType(RelationshipType relationshipType) {
        this.relationshipType = relationshipType;
    }
    
    public Integer getQuantityUsed() {
        return quantityUsed;
    }
    
    public void setQuantityUsed(Integer quantityUsed) {
        this.quantityUsed = quantityUsed;
    }
    
    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }
    
    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }
    
    public OffsetDateTime getProductionDate() {
        return productionDate;
    }
    
    public void setProductionDate(OffsetDateTime productionDate) {
        this.productionDate = productionDate;
    }
    
    public UUID getSupplierId() {
        return supplierId;
    }
    
    public void setSupplierId(UUID supplierId) {
        this.supplierId = supplierId;
    }
    
    public UUID getWarehouseId() {
        return warehouseId;
    }
    
    public void setWarehouseId(UUID warehouseId) {
        this.warehouseId = warehouseId;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
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
    
    public enum RelationshipType {
        COMPONENT_TO_ASSEMBLY,
        ASSEMBLY_TO_FINISHED_GOODS,
        RAW_MATERIAL_TO_COMPONENT,
        SUB_ASSEMBLY_TO_ASSEMBLY,
        LOT_TO_BATCH,
        BATCH_TO_LOT
    }
}