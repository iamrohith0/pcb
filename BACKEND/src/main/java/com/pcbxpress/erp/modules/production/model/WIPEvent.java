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
import java.time.LocalDate;
import java.util.UUID;

/**
 * WIP Event Entity
 * Tracks work-in-progress movements and status changes
 */
@Entity
@Table(name = "wip_events", indexes = {
    @Index(name = "idx_wip_events_work_order_id", columnList = "work_order_id"),
    @Index(name = "idx_wip_events_operation_id", columnList = "operation_id"),
    @Index(name = "idx_wip_events_event_type", columnList = "event_type"),
    @Index(name = "idx_wip_events_status", columnList = "status"),
    @Index(name = "idx_wip_events_created_at", columnList = "created_at"),
    @Index(name = "idx_wip_events_updated_at", columnList = "updated_at"),
    @Index(name = "idx_wip_events_batch_id", columnList = "batch_id")
})
public class WIPEvent {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "work_order_id", nullable = false)
    private UUID workOrderId;
    
    @Column(name = "operation_id", nullable = false)
    private UUID operationId;
    
    @Column(name = "batch_id", length = 100)
    private String batchId;
    
    @Column(name = "event_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private EventType eventType;
    
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Status status;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "scrap_quantity")
    private Integer scrapQuantity;
    
    @Column(name = "rework_quantity")
    private Integer reworkQuantity;
    
    @Column(name = "operator_id")
    private UUID operatorId;
    
    @Column(name = "operator_name", length = 200)
    private String operatorName;
    
    @Column(name = "machine_id")
    private UUID machineId;
    
    @Column(name = "machine_name", length = 200)
    private String machineName;
    
    @Column(name = "start_time")
    private OffsetDateTime startTime;
    
    @Column(name = "end_time")
    private OffsetDateTime endTime;
    
    @Column(name = "duration_minutes")
    private BigDecimal durationMinutes;
    
    @Column(name = "setup_time_minutes")
    private BigDecimal setupTimeMinutes;
    
    @Column(name = "cycle_time_minutes")
    private BigDecimal cycleTimeMinutes;
    
    @Column(name = "yield_percentage", precision = 5, scale = 2)
    private BigDecimal yieldPercentage;
    
    @Column(name = "rework_reason", length = 500)
    private String reworkReason;
    
    @Column(name = "hold_reason", length = 500)
    private String holdReason;
    
    @Column(name = "release_reason", length = 500)
    private String releaseReason;
    
    @Column(name = "quality_notes", columnDefinition = "text")
    private String qualityNotes;
    
    @Column(name = "production_notes", columnDefinition = "text")
    private String productionNotes;
    
    @Column(name = "inspection_results", columnDefinition = "text")
    private String inspectionResults;
    
    @Column(name = "material_consumption", columnDefinition = "text")
    private String materialConsumption;
    
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
    
    public UUID getWorkOrderId() {
        return workOrderId;
    }
    
    public void setWorkOrderId(UUID workOrderId) {
        this.workOrderId = workOrderId;
    }
    
    public UUID getOperationId() {
        return operationId;
    }
    
    public void setOperationId(UUID operationId) {
        this.operationId = operationId;
    }
    
    public String getBatchId() {
        return batchId;
    }
    
    public void setBatchId(String batchId) {
        this.batchId = batchId;
    }
    
    public EventType getEventType() {
        return eventType;
    }
    
    public void setEventType(EventType eventType) {
        this.eventType = eventType;
    }
    
    public Status getStatus() {
        return status;
    }
    
    public void setStatus(Status status) {
        this.status = status;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
    
    public Integer getScrapQuantity() {
        return scrapQuantity;
    }
    
    public void setScrapQuantity(Integer scrapQuantity) {
        this.scrapQuantity = scrapQuantity;
    }
    
    public Integer getReworkQuantity() {
        return reworkQuantity;
    }
    
    public void setReworkQuantity(Integer reworkQuantity) {
        this.reworkQuantity = reworkQuantity;
    }
    
    public UUID getOperatorId() {
        return operatorId;
    }
    
    public void setOperatorId(UUID operatorId) {
        this.operatorId = operatorId;
    }
    
    public String getOperatorName() {
        return operatorName;
    }
    
    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }
    
    public UUID getMachineId() {
        return machineId;
    }
    
    public void setMachineId(UUID machineId) {
        this.machineId = machineId;
    }
    
    public String getMachineName() {
        return machineName;
    }
    
    public void setMachineName(String machineName) {
        this.machineName = machineName;
    }
    
    public OffsetDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(OffsetDateTime startTime) {
        this.startTime = startTime;
    }
    
    public OffsetDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(OffsetDateTime endTime) {
        this.endTime = endTime;
    }
    
    public BigDecimal getDurationMinutes() {
        return durationMinutes;
    }
    
    public void setDurationMinutes(BigDecimal durationMinutes) {
        this.durationMinutes = durationMinutes;
    }
    
    public BigDecimal getSetupTimeMinutes() {
        return setupTimeMinutes;
    }
    
    public void setSetupTimeMinutes(BigDecimal setupTimeMinutes) {
        this.setupTimeMinutes = setupTimeMinutes;
    }
    
    public BigDecimal getCycleTimeMinutes() {
        return cycleTimeMinutes;
    }
    
    public void setCycleTimeMinutes(BigDecimal cycleTimeMinutes) {
        this.cycleTimeMinutes = cycleTimeMinutes;
    }
    
    public BigDecimal getYieldPercentage() {
        return yieldPercentage;
    }
    
    public void setYieldPercentage(BigDecimal yieldPercentage) {
        this.yieldPercentage = yieldPercentage;
    }
    
    public String getReworkReason() {
        return reworkReason;
    }
    
    public void setReworkReason(String reworkReason) {
        this.reworkReason = reworkReason;
    }
    
    public String getHoldReason() {
        return holdReason;
    }
    
    public void setHoldReason(String holdReason) {
        this.holdReason = holdReason;
    }
    
    public String getReleaseReason() {
        return releaseReason;
    }
    
    public void setReleaseReason(String releaseReason) {
        this.releaseReason = releaseReason;
    }
    
    public String getQualityNotes() {
        return qualityNotes;
    }
    
    public void setQualityNotes(String qualityNotes) {
        this.qualityNotes = qualityNotes;
    }
    
    public String getProductionNotes() {
        return productionNotes;
    }
    
    public void setProductionNotes(String productionNotes) {
        this.productionNotes = productionNotes;
    }
    
    public String getInspectionResults() {
        return inspectionResults;
    }
    
    public void setInspectionResults(String inspectionResults) {
        this.inspectionResults = inspectionResults;
    }
    
    public String getMaterialConsumption() {
        return materialConsumption;
    }
    
    public void setMaterialConsumption(String materialConsumption) {
        this.materialConsumption = materialConsumption;
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
    
    public enum EventType {
        START,
        PAUSE,
        RESUME,
        COMPLETE,
        HOLD,
        RELEASE,
        REWORK,
        SCRAP,
        TRANSFER
    }
    
    public enum Status {
        PENDING,
        IN_PROGRESS,
        COMPLETED,
        ON_HOLD,
        CANCELLED,
        REWORKED,
        SCRAPPED
    }
}