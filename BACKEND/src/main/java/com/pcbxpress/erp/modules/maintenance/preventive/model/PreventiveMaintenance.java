package com.pcbxpress.erp.modules.maintenance.preventive.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Preventive Maintenance entity for scheduled maintenance activities
 */
@Entity
@Table(name = "preventive_maintenance")
public class PreventiveMaintenance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false)
    private String maintenanceCode;
    
    @Column(nullable = false)
    private String maintenanceName;
    
    @Column
    private String description;
    
    @Column(nullable = false)
    private UUID equipmentId;
    
    @Column
    private String equipmentCode;
    
    @Column
    private String maintenanceType; // ROUTINE, INSPECTION, LUBRICATION, CALIBRATION
    
    @Column
    private String frequency; // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
    
    @Column
    private Integer frequencyValue;
    
    @Column
    private String frequencyUnit; // HOURS, DAYS, WEEKS, MONTHS, YEARS
    
    @Column
    private LocalDateTime lastPerformedDate;
    
    @Column
    private LocalDateTime nextDueDate;
    
    @Column
    private LocalDateTime scheduledDate;
    
    @Column
    private String status; // SCHEDULED, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED
    
    @Column
    private String priority; // HIGH, MEDIUM, LOW
    
    @Column
    private String assignedTo;
    
    @Column
    private String checklist;
    
    @Column
    private String estimatedDuration;
    
    @Column
    private String actualDuration;
    
    @Column
    private String notes;
    
    @Column
    private String createdBy;
    
    @Column
    private String updatedBy;
    
    @Column
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime updatedAt;
    
    // Constructors
    public PreventiveMaintenance() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getMaintenanceCode() { return maintenanceCode; }
    public void setMaintenanceCode(String maintenanceCode) { this.maintenanceCode = maintenanceCode; }
    
    public String getMaintenanceName() { return maintenanceName; }
    public void setMaintenanceName(String maintenanceName) { this.maintenanceName = maintenanceName; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public UUID getEquipmentId() { return equipmentId; }
    public void setEquipmentId(UUID equipmentId) { this.equipmentId = equipmentId; }
    
    public String getEquipmentCode() { return equipmentCode; }
    public void setEquipmentCode(String equipmentCode) { this.equipmentCode = equipmentCode; }
    
    public String getMaintenanceType() { return maintenanceType; }
    public void setMaintenanceType(String maintenanceType) { this.maintenanceType = maintenanceType; }
    
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    
    public Integer getFrequencyValue() { return frequencyValue; }
    public void setFrequencyValue(Integer frequencyValue) { this.frequencyValue = frequencyValue; }
    
    public String getFrequencyUnit() { return frequencyUnit; }
    public void setFrequencyUnit(String frequencyUnit) { this.frequencyUnit = frequencyUnit; }
    
    public LocalDateTime getLastPerformedDate() { return lastPerformedDate; }
    public void setLastPerformedDate(LocalDateTime lastPerformedDate) { this.lastPerformedDate = lastPerformedDate; }
    
    public LocalDateTime getNextDueDate() { return nextDueDate; }
    public void setNextDueDate(LocalDateTime nextDueDate) { this.nextDueDate = nextDueDate; }
    
    public LocalDateTime getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDateTime scheduledDate) { this.scheduledDate = scheduledDate; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    
    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
    
    public String getChecklist() { return checklist; }
    public void setChecklist(String checklist) { this.checklist = checklist; }
    
    public String getEstimatedDuration() { return estimatedDuration; }
    public void setEstimatedDuration(String estimatedDuration) { this.estimatedDuration = estimatedDuration; }
    
    public String getActualDuration() { return actualDuration; }
    public void setActualDuration(String actualDuration) { this.actualDuration = actualDuration; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}