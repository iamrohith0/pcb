package com.pcbxpress.erp.modules.maintenance.preventive.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.pcbxpress.erp.modules.maintenance.preventive.dto.PreventiveMaintenanceDto;
import com.pcbxpress.erp.modules.maintenance.preventive.dto.PreventiveMaintenancePayload;
import com.pcbxpress.erp.modules.maintenance.preventive.model.PreventiveMaintenance;
import com.pcbxpress.erp.modules.maintenance.preventive.repository.PreventiveMaintenanceRepository;

/**
 * Service implementation for Preventive Maintenance management
 */
@Service
public class PreventiveMaintenanceService {
    
    @Autowired
    private PreventiveMaintenanceRepository preventiveMaintenanceRepository;
    
    /**
     * Get all preventive maintenance records with pagination
     */
    public List<PreventiveMaintenanceDto> getAllPreventiveMaintenance(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PreventiveMaintenance> maintenancePage = preventiveMaintenanceRepository.findAll(pageable);
        return maintenancePage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get preventive maintenance by ID
     */
    public PreventiveMaintenanceDto getPreventiveMaintenanceById(UUID id) {
        PreventiveMaintenance maintenance = preventiveMaintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Preventive Maintenance not found with id: " + id));
        return convertToDto(maintenance);
    }
    
    /**
     * Create new preventive maintenance record
     */
    public PreventiveMaintenanceDto createPreventiveMaintenance(PreventiveMaintenancePayload payload) {
        PreventiveMaintenance maintenance = convertToEntity(payload);
        maintenance.setCreatedAt(LocalDateTime.now());
        maintenance.setUpdatedAt(LocalDateTime.now());
        PreventiveMaintenance savedMaintenance = preventiveMaintenanceRepository.save(maintenance);
        return convertToDto(savedMaintenance);
    }
    
    /**
     * Update preventive maintenance record
     */
    public PreventiveMaintenanceDto updatePreventiveMaintenance(UUID id, PreventiveMaintenancePayload payload) {
        PreventiveMaintenance existingMaintenance = preventiveMaintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Preventive Maintenance not found with id: " + id));
        
        // Update fields
        existingMaintenance.setMaintenanceName(payload.getMaintenanceName());
        existingMaintenance.setDescription(payload.getDescription());
        existingMaintenance.setEquipmentId(payload.getEquipmentId());
        existingMaintenance.setEquipmentCode(payload.getEquipmentCode());
        existingMaintenance.setMaintenanceType(payload.getMaintenanceType());
        existingMaintenance.setFrequency(payload.getFrequency());
        existingMaintenance.setFrequencyValue(payload.getFrequencyValue());
        existingMaintenance.setFrequencyUnit(payload.getFrequencyUnit());
        existingMaintenance.setLastPerformedDate(payload.getLastPerformedDate());
        existingMaintenance.setNextDueDate(payload.getNextDueDate());
        existingMaintenance.setScheduledDate(payload.getScheduledDate());
        existingMaintenance.setStatus(payload.getStatus());
        existingMaintenance.setPriority(payload.getPriority());
        existingMaintenance.setAssignedTo(payload.getAssignedTo());
        existingMaintenance.setChecklist(payload.getChecklist());
        existingMaintenance.setEstimatedDuration(payload.getEstimatedDuration());
        existingMaintenance.setActualDuration(payload.getActualDuration());
        existingMaintenance.setNotes(payload.getNotes());
        existingMaintenance.setUpdatedAt(LocalDateTime.now());
        
        PreventiveMaintenance updatedMaintenance = preventiveMaintenanceRepository.save(existingMaintenance);
        return convertToDto(updatedMaintenance);
    }
    
    /**
     * Delete preventive maintenance record
     */
    public void deletePreventiveMaintenance(UUID id) {
        PreventiveMaintenance maintenance = preventiveMaintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Preventive Maintenance not found with id: " + id));
        preventiveMaintenanceRepository.delete(maintenance);
    }
    
    /**
     * Get equipment schedule
     */
    public List<PreventiveMaintenanceDto> getEquipmentSchedule(UUID equipmentId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findByEquipmentId(equipmentId);
        List<PreventiveMaintenance> pagedList = maintenanceList.stream()
                .skip(pageable.getOffset())
                .limit(pageable.getPageSize())
                .collect(Collectors.toList());
        Page<PreventiveMaintenance> maintenancePage = new PageImpl<>(pagedList, pageable, maintenanceList.size());
        return maintenancePage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get equipment schedule by equipment code
     */
    public List<PreventiveMaintenanceDto> getEquipmentScheduleByCode(String equipmentCode, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findByEquipmentCode(equipmentCode);
        List<PreventiveMaintenance> pagedList = maintenanceList.stream()
                .skip(pageable.getOffset())
                .limit(pageable.getPageSize())
                .collect(Collectors.toList());
        Page<PreventiveMaintenance> maintenancePage = new PageImpl<>(pagedList, pageable, maintenanceList.size());
        return maintenancePage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get schedule history for equipment
     */
    public List<PreventiveMaintenanceDto> getScheduleHistory(UUID equipmentId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findByEquipmentId(equipmentId);
        List<PreventiveMaintenance> filteredList = maintenanceList.stream()
                .filter(m -> "COMPLETED".equals(m.getStatus()))
                .collect(Collectors.toList());
        List<PreventiveMaintenance> pagedList = maintenanceList.stream()
                .skip(pageable.getOffset())
                .limit(pageable.getPageSize())
                .collect(Collectors.toList());
        Page<PreventiveMaintenance> maintenancePage = new PageImpl<>(pagedList, pageable, maintenanceList.size());
        return maintenancePage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Update maintenance status
     */
    public PreventiveMaintenanceDto updateMaintenanceStatus(UUID id, String status) {
        PreventiveMaintenance maintenance = preventiveMaintenanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Preventive Maintenance not found with id: " + id));
        maintenance.setStatus(status);
        maintenance.setUpdatedAt(LocalDateTime.now());
        PreventiveMaintenance updatedMaintenance = preventiveMaintenanceRepository.save(maintenance);
        return convertToDto(updatedMaintenance);
    }
    
    /**
     * Get maintenance report
     */
    public List<PreventiveMaintenanceDto> getMaintenanceReport() {
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findAll();
        return maintenanceList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get upcoming maintenance tasks
     */
    public List<PreventiveMaintenanceDto> getUpcomingTasks(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findByStatus("SCHEDULED");
        List<PreventiveMaintenance> filteredList = maintenanceList.stream()
                .filter(m -> m.getNextDueDate() != null && m.getNextDueDate().isAfter(LocalDateTime.now()))
                .collect(Collectors.toList());
        List<PreventiveMaintenance> pagedList = filteredList.stream()
                .skip(pageable.getOffset())
                .limit(pageable.getPageSize())
                .collect(Collectors.toList());
        Page<PreventiveMaintenance> maintenancePage = new PageImpl<>(pagedList, pageable, filteredList.size());
        return maintenancePage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get overdue maintenance tasks
     */
    public List<PreventiveMaintenanceDto> getOverdueTasks(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findByStatus("SCHEDULED");
        List<PreventiveMaintenance> filteredList = maintenanceList.stream()
                .filter(m -> m.getNextDueDate() != null && m.getNextDueDate().isBefore(LocalDateTime.now()))
                .collect(Collectors.toList());
        List<PreventiveMaintenance> pagedList = filteredList.stream()
                .skip(pageable.getOffset())
                .limit(pageable.getPageSize())
                .collect(Collectors.toList());
        Page<PreventiveMaintenance> maintenancePage = new PageImpl<>(pagedList, pageable, filteredList.size());
        return maintenancePage.getContent().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get maintenance by maintenance code
     */
    public PreventiveMaintenanceDto getMaintenanceByCode(String maintenanceCode) {
        PreventiveMaintenance maintenance = preventiveMaintenanceRepository.findByMaintenanceCode(maintenanceCode);
        if (maintenance == null) {
            throw new RuntimeException("Preventive Maintenance not found with code: " + maintenanceCode);
        }
        return convertToDto(maintenance);
    }
    
    /**
     * Get maintenance by status
     */
    public List<PreventiveMaintenanceDto> getMaintenanceByStatus(String status) {
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findByStatus(status);
        return maintenanceList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get maintenance by maintenance type
     */
    public List<PreventiveMaintenanceDto> getMaintenanceByType(String maintenanceType) {
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findByMaintenanceType(maintenanceType);
        return maintenanceList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get maintenance by frequency
     */
    public List<PreventiveMaintenanceDto> getMaintenanceByFrequency(String frequency) {
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findByFrequency(frequency);
        return maintenanceList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get maintenance by priority
     */
    public List<PreventiveMaintenanceDto> getMaintenanceByPriority(String priority) {
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findByPriority(priority);
        return maintenanceList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get maintenance by assigned to
     */
    public List<PreventiveMaintenanceDto> getMaintenanceByAssignedTo(String assignedTo) {
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository.findByAssignedTo(assignedTo);
        return maintenanceList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get maintenance by scheduled date range
     */
    public List<PreventiveMaintenanceDto> getMaintenanceByScheduledDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository
                .findByScheduledDateBetween(startDate, endDate);
        return maintenanceList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get maintenance by next due date range
     */
    public List<PreventiveMaintenanceDto> getMaintenanceByNextDueDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<PreventiveMaintenance> maintenanceList = preventiveMaintenanceRepository
                .findByNextDueDateBetween(startDate, endDate);
        return maintenanceList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert PreventiveMaintenance entity to PreventiveMaintenanceDto
     */
    private PreventiveMaintenanceDto convertToDto(PreventiveMaintenance maintenance) {
        PreventiveMaintenanceDto dto = new PreventiveMaintenanceDto();
        dto.setId(maintenance.getId());
        dto.setMaintenanceCode(maintenance.getMaintenanceCode());
        dto.setMaintenanceName(maintenance.getMaintenanceName());
        dto.setDescription(maintenance.getDescription());
        dto.setEquipmentId(maintenance.getEquipmentId());
        dto.setEquipmentCode(maintenance.getEquipmentCode());
        dto.setMaintenanceType(maintenance.getMaintenanceType());
        dto.setFrequency(maintenance.getFrequency());
        dto.setFrequencyValue(maintenance.getFrequencyValue());
        dto.setFrequencyUnit(maintenance.getFrequencyUnit());
        dto.setLastPerformedDate(maintenance.getLastPerformedDate());
        dto.setNextDueDate(maintenance.getNextDueDate());
        dto.setScheduledDate(maintenance.getScheduledDate());
        dto.setStatus(maintenance.getStatus());
        dto.setPriority(maintenance.getPriority());
        dto.setAssignedTo(maintenance.getAssignedTo());
        dto.setChecklist(maintenance.getChecklist());
        dto.setEstimatedDuration(maintenance.getEstimatedDuration());
        dto.setActualDuration(maintenance.getActualDuration());
        dto.setNotes(maintenance.getNotes());
        dto.setCreatedBy(maintenance.getCreatedBy());
        dto.setUpdatedBy(maintenance.getUpdatedBy());
        dto.setCreatedAt(maintenance.getCreatedAt());
        dto.setUpdatedAt(maintenance.getUpdatedAt());
        return dto;
    }
    
    /**
     * Convert PreventiveMaintenancePayload to PreventiveMaintenance entity
     */
    private PreventiveMaintenance convertToEntity(PreventiveMaintenancePayload payload) {
        PreventiveMaintenance maintenance = new PreventiveMaintenance();
        maintenance.setMaintenanceCode(generateMaintenanceCode());
        maintenance.setMaintenanceName(payload.getMaintenanceName());
        maintenance.setDescription(payload.getDescription());
        maintenance.setEquipmentId(payload.getEquipmentId());
        maintenance.setEquipmentCode(payload.getEquipmentCode());
        maintenance.setMaintenanceType(payload.getMaintenanceType());
        maintenance.setFrequency(payload.getFrequency());
        maintenance.setFrequencyValue(payload.getFrequencyValue());
        maintenance.setFrequencyUnit(payload.getFrequencyUnit());
        maintenance.setLastPerformedDate(payload.getLastPerformedDate());
        maintenance.setNextDueDate(payload.getNextDueDate());
        maintenance.setScheduledDate(payload.getScheduledDate());
        maintenance.setStatus(payload.getStatus());
        maintenance.setPriority(payload.getPriority());
        maintenance.setAssignedTo(payload.getAssignedTo());
        maintenance.setChecklist(payload.getChecklist());
        maintenance.setEstimatedDuration(payload.getEstimatedDuration());
        maintenance.setActualDuration(payload.getActualDuration());
        maintenance.setNotes(payload.getNotes());
        return maintenance;
    }
    
    /**
     * Generate maintenance code
     */
    private String generateMaintenanceCode() {
        // Simple implementation - in production, you might want a more sophisticated approach
        return "PM-" + System.currentTimeMillis();
    }
}