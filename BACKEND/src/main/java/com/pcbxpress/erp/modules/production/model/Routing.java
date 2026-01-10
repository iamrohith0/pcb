package com.pcbxpress.erp.modules.production.model;

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
 * Routing Entity
 * Defines the sequence of operations for manufacturing a product
 */
@Entity
@Table(name = "routings", indexes = {
    @Index(name = "idx_routings_code", columnList = "routing_code"),
    @Index(name = "idx_routings_item_code", columnList = "item_code"),
    @Index(name = "idx_routings_status", columnList = "status"),
    @Index(name = "idx_routings_version", columnList = "version"),
    @Index(name = "idx_routings_created_at", columnList = "created_at"),
    @Index(name = "idx_routings_updated_at", columnList = "updated_at")
})
public class Routing {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "routing_code", nullable = false, unique = true, length = 50)
    private String routingCode;
    
    @Column(name = "item_code", nullable = false, length = 50)
    private String itemCode;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "version", nullable = false)
    private Integer version;
    
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private RoutingStatus status;
    
    @Column(name = "estimated_total_time", precision = 10, scale = 2)
    private BigDecimal estimatedTotalTime;
    
    @Column(name = "estimated_total_cost", precision = 15, scale = 2)
    private BigDecimal estimatedTotalCost;
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive;
    
    @Column(name = "is_default", nullable = false)
    private boolean isDefault;
    
    @Column(name = "revision_notes", columnDefinition = "text")
    private String revisionNotes;
    
    @Column(name = "engineering_notes", columnDefinition = "text")
    private String engineeringNotes;
    
    @Column(name = "quality_requirements", columnDefinition = "text")
    private String qualityRequirements;
    
    @Column(name = "safety_requirements", columnDefinition = "text")
    private String safetyRequirements;
    
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
    
    public String getRoutingCode() {
        return routingCode;
    }
    
    public void setRoutingCode(String routingCode) {
        this.routingCode = routingCode;
    }
    
    public String getItemCode() {
        return itemCode;
    }
    
    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Integer getVersion() {
        return version;
    }
    
    public void setVersion(Integer version) {
        this.version = version;
    }
    
    public RoutingStatus getStatus() {
        return status;
    }
    
    public void setStatus(RoutingStatus status) {
        this.status = status;
    }
    
    public BigDecimal getEstimatedTotalTime() {
        return estimatedTotalTime;
    }
    
    public void setEstimatedTotalTime(BigDecimal estimatedTotalTime) {
        this.estimatedTotalTime = estimatedTotalTime;
    }
    
    public BigDecimal getEstimatedTotalCost() {
        return estimatedTotalCost;
    }
    
    public void setEstimatedTotalCost(BigDecimal estimatedTotalCost) {
        this.estimatedTotalCost = estimatedTotalCost;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    public boolean isDefault() {
        return isDefault;
    }
    
    public void setDefault(boolean aDefault) {
        isDefault = aDefault;
    }
    
    public String getRevisionNotes() {
        return revisionNotes;
    }
    
    public void setRevisionNotes(String revisionNotes) {
        this.revisionNotes = revisionNotes;
    }
    
    public String getEngineeringNotes() {
        return engineeringNotes;
    }
    
    public void setEngineeringNotes(String engineeringNotes) {
        this.engineeringNotes = engineeringNotes;
    }
    
    public String getQualityRequirements() {
        return qualityRequirements;
    }
    
    public void setQualityRequirements(String qualityRequirements) {
        this.qualityRequirements = qualityRequirements;
    }
    
    public String getSafetyRequirements() {
        return safetyRequirements;
    }
    
    public void setSafetyRequirements(String safetyRequirements) {
        this.safetyRequirements = safetyRequirements;
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
    
    public enum RoutingStatus {
        DRAFT,
        ACTIVE,
        INACTIVE,
        OBSOLETE,
        UNDER_REVIEW
    }
}