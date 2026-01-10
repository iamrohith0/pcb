package com.pcbxpress.erp.modules.maintenance.preventive.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Payload DTO for creating and updating preventive maintenance
 */
public class PreventiveMaintenancePayload {
    
    private String maintenanceCode;
    private String maintenanceName;
    private String description;
    private UUID equipmentId;
    private String equipmentCode;
    private String maintenanceType;
    private String frequency;
    private Integer frequencyValue;
    private String frequencyUnit;
    private LocalDateTime lastPerformedDate;
    private LocalDateTime nextDueDate;
    private LocalDateTime scheduledDate;
    private String status;
    private String priority;
    private String assignedTo;
    private String checklist;
    private String estimatedDuration;
    private String actualDuration;
    private String notes;
    
    // Constructors
    public PreventiveMaintenancePayload() {}
    
    // Getters and Setters
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
}