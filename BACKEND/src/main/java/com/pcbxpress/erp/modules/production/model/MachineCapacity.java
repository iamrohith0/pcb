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
 * Machine Capacity Entity
 * Tracks machine availability and capacity planning
 */
@Entity
@Table(name = "machine_capacity", indexes = {
    @Index(name = "idx_machine_capacity_machine_id", columnList = "machine_id"),
    @Index(name = "idx_machine_capacity_date", columnList = "date"),
    @Index(name = "idx_machine_capacity_shift", columnList = "shift"),
    @Index(name = "idx_machine_capacity_status", columnList = "status"),
    @Index(name = "idx_machine_capacity_created_at", columnList = "created_at"),
    @Index(name = "idx_machine_capacity_updated_at", columnList = "updated_at")
})
public class MachineCapacity {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "machine_id", nullable = false)
    private UUID machineId;
    
    @Column(name = "machine_name", nullable = false, length = 200)
    private String machineName;
    
    @Column(name = "machine_type", nullable = false, length = 100)
    private String machineType;
    
    @Column(name = "date", nullable = false)
    private LocalDate date;
    
    @Column(name = "shift", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Shift shift;
    
    @Column(name = "shift_start")
    private OffsetDateTime shiftStart;
    
    @Column(name = "shift_end")
    private OffsetDateTime shiftEnd;
    
    @Column(name = "planned_hours", precision = 5, scale = 2)
    private BigDecimal plannedHours;
    
    @Column(name = "available_hours", precision = 5, scale = 2)
    private BigDecimal availableHours;
    
    @Column(name = "utilization_percentage", precision = 5, scale = 2)
    private BigDecimal utilizationPercentage;
    
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private Status status;
    
    @Column(name = "work_order_id")
    private UUID workOrderId;
    
    @Column(name = "operation_id")
    private UUID operationId;
    
    @Column(name = "assigned_quantity")
    private Integer assignedQuantity;
    
    @Column(name = "completed_quantity")
    private Integer completedQuantity;
    
    @Column(name = "setup_time_minutes")
    private BigDecimal setupTimeMinutes;
    
    @Column(name = "downtime_minutes")
    private BigDecimal downtimeMinutes;
    
    @Column(name = "maintenance_hours", precision = 5, scale = 2)
    private BigDecimal maintenanceHours;
    
    @Column(name = "breakdown_hours", precision = 5, scale = 2)
    private BigDecimal breakdownHours;
    
    @Column(name = "oee_availability", precision = 5, scale = 2)
    private BigDecimal oeeAvailability;
    
    @Column(name = "oee_performance", precision = 5, scale = 2)
    private BigDecimal oeePerformance;
    
    @Column(name = "oee_quality", precision = 5, scale = 2)
    private BigDecimal oeeQuality;
    
    @Column(name = "oee_overall", precision = 5, scale = 2)
    private BigDecimal oeeOverall;
    
    @Column(name = "capacity_notes", columnDefinition = "text")
    private String capacityNotes;
    
    @Column(name = "maintenance_notes", columnDefinition = "text")
    private String maintenanceNotes;
    
    @Column(name = "performance_notes", columnDefinition = "text")
    private String performanceNotes;
    
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
    
    public String getMachineType() {
        return machineType;
    }
    
    public void setMachineType(String machineType) {
        this.machineType = machineType;
    }
    
    public LocalDate getDate() {
        return date;
    }
    
    public void setDate(LocalDate date) {
        this.date = date;
    }
    
    public Shift getShift() {
        return shift;
    }
    
    public void setShift(Shift shift) {
        this.shift = shift;
    }
    
    public OffsetDateTime getShiftStart() {
        return shiftStart;
    }
    
    public void setShiftStart(OffsetDateTime shiftStart) {
        this.shiftStart = shiftStart;
    }
    
    public OffsetDateTime getShiftEnd() {
        return shiftEnd;
    }
    
    public void setShiftEnd(OffsetDateTime shiftEnd) {
        this.shiftEnd = shiftEnd;
    }
    
    public BigDecimal getPlannedHours() {
        return plannedHours;
    }
    
    public void setPlannedHours(BigDecimal plannedHours) {
        this.plannedHours = plannedHours;
    }
    
    public BigDecimal getAvailableHours() {
        return availableHours;
    }
    
    public void setAvailableHours(BigDecimal availableHours) {
        this.availableHours = availableHours;
    }
    
    public BigDecimal getUtilizationPercentage() {
        return utilizationPercentage;
    }
    
    public void setUtilizationPercentage(BigDecimal utilizationPercentage) {
        this.utilizationPercentage = utilizationPercentage;
    }
    
    public Status getStatus() {
        return status;
    }
    
    public void setStatus(Status status) {
        this.status = status;
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
    
    public Integer getAssignedQuantity() {
        return assignedQuantity;
    }
    
    public void setAssignedQuantity(Integer assignedQuantity) {
        this.assignedQuantity = assignedQuantity;
    }
    
    public Integer getCompletedQuantity() {
        return completedQuantity;
    }
    
    public void setCompletedQuantity(Integer completedQuantity) {
        this.completedQuantity = completedQuantity;
    }
    
    public BigDecimal getSetupTimeMinutes() {
        return setupTimeMinutes;
    }
    
    public void setSetupTimeMinutes(BigDecimal setupTimeMinutes) {
        this.setupTimeMinutes = setupTimeMinutes;
    }
    
    public BigDecimal getDowntimeMinutes() {
        return downtimeMinutes;
    }
    
    public void setDowntimeMinutes(BigDecimal downtimeMinutes) {
        this.downtimeMinutes = downtimeMinutes;
    }
    
    public BigDecimal getMaintenanceHours() {
        return maintenanceHours;
    }
    
    public void setMaintenanceHours(BigDecimal maintenanceHours) {
        this.maintenanceHours = maintenanceHours;
    }
    
    public BigDecimal getBreakdownHours() {
        return breakdownHours;
    }
    
    public void setBreakdownHours(BigDecimal breakdownHours) {
        this.breakdownHours = breakdownHours;
    }
    
    public BigDecimal getOeeAvailability() {
        return oeeAvailability;
    }
    
    public void setOeeAvailability(BigDecimal oeeAvailability) {
        this.oeeAvailability = oeeAvailability;
    }
    
    public BigDecimal getOeePerformance() {
        return oeePerformance;
    }
    
    public void setOeePerformance(BigDecimal oeePerformance) {
        this.oeePerformance = oeePerformance;
    }
    
    public BigDecimal getOeeQuality() {
        return oeeQuality;
    }
    
    public void setOeeQuality(BigDecimal oeeQuality) {
        this.oeeQuality = oeeQuality;
    }
    
    public BigDecimal getOeeOverall() {
        return oeeOverall;
    }
    
    public void setOeeOverall(BigDecimal oeeOverall) {
        this.oeeOverall = oeeOverall;
    }
    
    public String getCapacityNotes() {
        return capacityNotes;
    }
    
    public void setCapacityNotes(String capacityNotes) {
        this.capacityNotes = capacityNotes;
    }
    
    public String getMaintenanceNotes() {
        return maintenanceNotes;
    }
    
    public void setMaintenanceNotes(String maintenanceNotes) {
        this.maintenanceNotes = maintenanceNotes;
    }
    
    public String getPerformanceNotes() {
        return performanceNotes;
    }
    
    public void setPerformanceNotes(String performanceNotes) {
        this.performanceNotes = performanceNotes;
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
    
    public enum Shift {
        FIRST,
        SECOND,
        THIRD,
        OVERTIME
    }
    
    public enum Status {
        AVAILABLE,
        ASSIGNED,
        IN_USE,
        MAINTENANCE,
        BREAKDOWN,
        IDLE
    }
}