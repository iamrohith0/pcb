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
 * Operation Entity
 * Represents a single manufacturing step in a routing
 */
@Entity
@Table(name = "operations", indexes = {
    @Index(name = "idx_operations_code", columnList = "operation_code"),
    @Index(name = "idx_operations_routing_id", columnList = "routing_id"),
    @Index(name = "idx_operations_sequence", columnList = "sequence_number"),
    @Index(name = "idx_operations_machine_type", columnList = "machine_type"),
    @Index(name = "idx_operations_created_at", columnList = "created_at"),
    @Index(name = "idx_operations_updated_at", columnList = "updated_at")
})
public class Operation {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "operation_code", nullable = false, length = 50)
    private String operationCode;
    
    @Column(name = "routing_id", nullable = false)
    private UUID routingId;
    
    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;
    
    @Column(name = "description", nullable = false, length = 500)
    private String description;
    
    @Column(name = "operation_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private OperationType operationType;
    
    @Column(name = "machine_type", length = 100)
    private String machineType;
    
    @Column(name = "machine_id")
    private UUID machineId;
    
    @Column(name = "estimated_time", precision = 10, scale = 2)
    private BigDecimal estimatedTime;
    
    @Column(name = "setup_time", precision = 10, scale = 2)
    private BigDecimal setupTime;
    
    @Column(name = "cycle_time", precision = 10, scale = 2)
    private BigDecimal cycleTime;
    
    @Column(name = "estimated_cost", precision = 15, scale = 2)
    private BigDecimal estimatedCost;
    
    @Column(name = "labor_rate", precision = 10, scale = 2)
    private BigDecimal laborRate;
    
    @Column(name = "machine_rate", precision = 10, scale = 2)
    private BigDecimal machineRate;
    
    @Column(name = "is_critical", nullable = false)
    private boolean isCritical;
    
    @Column(name = "is_inspection", nullable = false)
    private boolean isInspection;
    
    @Column(name = "requires_tooling", nullable = false)
    private boolean requiresTooling;
    
    @Column(name = "tooling_code", length = 100)
    private String toolingCode;
    
    @Column(name = "setup_instructions", columnDefinition = "text")
    private String setupInstructions;
    
    @Column(name = "operation_instructions", columnDefinition = "text")
    private String operationInstructions;
    
    @Column(name = "quality_checks", columnDefinition = "text")
    private String qualityChecks;
    
    @Column(name = "safety_requirements", columnDefinition = "text")
    private String safetyRequirements;
    
    @Column(name = "materials_required", columnDefinition = "text")
    private String materialsRequired;
    
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
    
    public String getOperationCode() {
        return operationCode;
    }
    
    public void setOperationCode(String operationCode) {
        this.operationCode = operationCode;
    }
    
    public UUID getRoutingId() {
        return routingId;
    }
    
    public void setRoutingId(UUID routingId) {
        this.routingId = routingId;
    }
    
    public Integer getSequenceNumber() {
        return sequenceNumber;
    }
    
    public void setSequenceNumber(Integer sequenceNumber) {
        this.sequenceNumber = sequenceNumber;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public OperationType getOperationType() {
        return operationType;
    }
    
    public void setOperationType(OperationType operationType) {
        this.operationType = operationType;
    }
    
    public String getMachineType() {
        return machineType;
    }
    
    public void setMachineType(String machineType) {
        this.machineType = machineType;
    }
    
    public UUID getMachineId() {
        return machineId;
    }
    
    public void setMachineId(UUID machineId) {
        this.machineId = machineId;
    }
    
    public BigDecimal getEstimatedTime() {
        return estimatedTime;
    }
    
    public void setEstimatedTime(BigDecimal estimatedTime) {
        this.estimatedTime = estimatedTime;
    }
    
    public BigDecimal getSetupTime() {
        return setupTime;
    }
    
    public void setSetupTime(BigDecimal setupTime) {
        this.setupTime = setupTime;
    }
    
    public BigDecimal getCycleTime() {
        return cycleTime;
    }
    
    public void setCycleTime(BigDecimal cycleTime) {
        this.cycleTime = cycleTime;
    }
    
    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }
    
    public void setEstimatedCost(BigDecimal estimatedCost) {
        this.estimatedCost = estimatedCost;
    }
    
    public BigDecimal getLaborRate() {
        return laborRate;
    }
    
    public void setLaborRate(BigDecimal laborRate) {
        this.laborRate = laborRate;
    }
    
    public BigDecimal getMachineRate() {
        return machineRate;
    }
    
    public void setMachineRate(BigDecimal machineRate) {
        this.machineRate = machineRate;
    }
    
    public boolean isCritical() {
        return isCritical;
    }
    
    public void setCritical(boolean critical) {
        isCritical = critical;
    }
    
    public boolean isInspection() {
        return isInspection;
    }
    
    public void setInspection(boolean inspection) {
        isInspection = inspection;
    }
    
    public boolean requiresTooling() {
        return requiresTooling;
    }
    
    public void setRequiresTooling(boolean requiresTooling) {
        this.requiresTooling = requiresTooling;
    }
    
    public String getToolingCode() {
        return toolingCode;
    }
    
    public void setToolingCode(String toolingCode) {
        this.toolingCode = toolingCode;
    }
    
    public String getSetupInstructions() {
        return setupInstructions;
    }
    
    public void setSetupInstructions(String setupInstructions) {
        this.setupInstructions = setupInstructions;
    }
    
    public String getOperationInstructions() {
        return operationInstructions;
    }
    
    public void setOperationInstructions(String operationInstructions) {
        this.operationInstructions = operationInstructions;
    }
    
    public String getQualityChecks() {
        return qualityChecks;
    }
    
    public void setQualityChecks(String qualityChecks) {
        this.qualityChecks = qualityChecks;
    }
    
    public String getSafetyRequirements() {
        return safetyRequirements;
    }
    
    public void setSafetyRequirements(String safetyRequirements) {
        this.safetyRequirements = safetyRequirements;
    }
    
    public String getMaterialsRequired() {
        return materialsRequired;
    }
    
    public void setMaterialsRequired(String materialsRequired) {
        this.materialsRequired = materialsRequired;
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
    
    public enum OperationType {
        PREPARATION,
        DRILLING,
        PLATING,
        IMAGING,
        ETCHING,
        SOLDERMASK,
        SILKSCREEN,
        SURFACE_FINISH,
        ROUTING,
        TESTING,
        INSPECTION,
        PACKAGING
    }
}