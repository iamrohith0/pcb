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
 * Bill of Materials Component Entity
 * Represents a component or material within a BOM
 */
@Entity
@Table(name = "inventory_bom_components", indexes = {
    @Index(name = "idx_bom_components_bom_id", columnList = "bom_id"),
    @Index(name = "idx_bom_components_item_id", columnList = "item_id"),
    @Index(name = "idx_bom_components_sequence", columnList = "sequence"),
    @Index(name = "idx_bom_components_created_at", columnList = "created_at"),
    @Index(name = "idx_bom_components_updated_at", columnList = "updated_at")
})
public class BomComponent {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "bom_id", nullable = false, columnDefinition = "uuid")
    private UUID bomId;
    
    @Column(name = "item_id", nullable = false, columnDefinition = "uuid")
    private UUID itemId;
    
    @Column(name = "component_number", length = 100)
    private String componentNumber;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "quantity", nullable = false)
    private BigDecimal quantity;
    
    @Column(name = "unit_of_measure", length = 20)
    private String unitOfMeasure;
    
    @Column(name = "sequence")
    private Integer sequence;
    
    @Column(name = "reference_designator", length = 100)
    private String referenceDesignator;
    
    @Column(name = "component_type", length = 50)
    @Enumerated(EnumType.STRING)
    private ComponentType componentType;
    
    @Column(name = "is_optional")
    private boolean optional;
    
    @Column(name = "is_critical")
    private boolean critical;
    
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
    
    public UUID getBomId() {
        return bomId;
    }
    
    public void setBomId(UUID bomId) {
        this.bomId = bomId;
    }
    
    public UUID getItemId() {
        return itemId;
    }
    
    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }
    
    public String getComponentNumber() {
        return componentNumber;
    }
    
    public void setComponentNumber(String componentNumber) {
        this.componentNumber = componentNumber;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public BigDecimal getQuantity() {
        return quantity;
    }
    
    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
    
    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }
    
    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }
    
    public Integer getSequence() {
        return sequence;
    }
    
    public void setSequence(Integer sequence) {
        this.sequence = sequence;
    }
    
    public String getReferenceDesignator() {
        return referenceDesignator;
    }
    
    public void setReferenceDesignator(String referenceDesignator) {
        this.referenceDesignator = referenceDesignator;
    }
    
    public ComponentType getComponentType() {
        return componentType;
    }
    
    public void setComponentType(ComponentType componentType) {
        this.componentType = componentType;
    }
    
    public boolean isOptional() {
        return optional;
    }
    
    public void setOptional(boolean optional) {
        this.optional = optional;
    }
    
    public boolean isCritical() {
        return critical;
    }
    
    public void setCritical(boolean critical) {
        this.critical = critical;
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
    
    public enum ComponentType {
        COMPONENT,
        SUB_ASSEMBLY,
        RAW_MATERIAL,
        FINISHED_GOODS,
        PACKAGING,
        OTHER
    }
}