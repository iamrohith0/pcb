package com.pcbxpress.erp.modules.maintenance.preventive.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pcbxpress.erp.modules.maintenance.preventive.dto.PreventiveMaintenanceDto;
import com.pcbxpress.erp.modules.maintenance.preventive.dto.PreventiveMaintenancePayload;
import com.pcbxpress.erp.modules.maintenance.preventive.service.PreventiveMaintenanceService;

/**
 * REST Controller for Preventive Maintenance management
 */
@RestController
@RequestMapping("/api/maintenance/preventive")
@CrossOrigin(origins = "*")
public class PreventiveMaintenanceController {
    
    @Autowired
    private PreventiveMaintenanceService preventiveMaintenanceService;
    
    /**
     * Get all preventive maintenance records with pagination
     */
    @GetMapping
    public ResponseEntity<List<PreventiveMaintenanceDto>> getAllPreventiveMaintenance(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<PreventiveMaintenanceDto> maintenanceList = preventiveMaintenanceService.getAllPreventiveMaintenance(page, size);
        return ResponseEntity.ok(maintenanceList);
    }
    
    /**
     * Get preventive maintenance by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PreventiveMaintenanceDto> getPreventiveMaintenanceById(@PathVariable UUID id) {
        PreventiveMaintenanceDto maintenance = preventiveMaintenanceService.getPreventiveMaintenanceById(id);
        return ResponseEntity.ok(maintenance);
    }
    
    /**
     * Create new preventive maintenance record
     */
    @PostMapping
    public ResponseEntity<PreventiveMaintenanceDto> createPreventiveMaintenance(@RequestBody PreventiveMaintenancePayload payload) {
        PreventiveMaintenanceDto maintenance = preventiveMaintenanceService.createPreventiveMaintenance(payload);
        return ResponseEntity.ok(maintenance);
    }
    
    /**
     * Update preventive maintenance record
     */
    @PutMapping("/{id}")
    public ResponseEntity<PreventiveMaintenanceDto> updatePreventiveMaintenance(@PathVariable UUID id, @RequestBody PreventiveMaintenancePayload payload) {
        PreventiveMaintenanceDto maintenance = preventiveMaintenanceService.updatePreventiveMaintenance(id, payload);
        return ResponseEntity.ok(maintenance);
    }
    
    /**
     * Delete preventive maintenance record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePreventiveMaintenance(@PathVariable UUID id) {
        preventiveMaintenanceService.deletePreventiveMaintenance(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get equipment schedule
     */
    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getEquipmentSchedule(
            @PathVariable UUID equipmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<PreventiveMaintenanceDto> schedule = preventiveMaintenanceService.getEquipmentSchedule(equipmentId, page, size);
        return ResponseEntity.ok(schedule);
    }
    
    /**
     * Get equipment schedule by equipment code
     */
    @GetMapping("/equipment/code/{equipmentCode}")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getEquipmentScheduleByCode(
            @PathVariable String equipmentCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<PreventiveMaintenanceDto> schedule = preventiveMaintenanceService.getEquipmentScheduleByCode(equipmentCode, page, size);
        return ResponseEntity.ok(schedule);
    }
    
    /**
     * Get schedule history for equipment
     */
    @GetMapping("/history/{equipmentId}")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getScheduleHistory(
            @PathVariable UUID equipmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<PreventiveMaintenanceDto> history = preventiveMaintenanceService.getScheduleHistory(equipmentId, page, size);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Update maintenance status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<PreventiveMaintenanceDto> updateMaintenanceStatus(@PathVariable UUID id, @RequestBody String status) {
        PreventiveMaintenanceDto maintenance = preventiveMaintenanceService.updateMaintenanceStatus(id, status);
        return ResponseEntity.ok(maintenance);
    }
    
    /**
     * Get maintenance report
     */
    @GetMapping("/report")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getMaintenanceReport() {
        List<PreventiveMaintenanceDto> report = preventiveMaintenanceService.getMaintenanceReport();
        return ResponseEntity.ok(report);
    }
    
    /**
     * Get upcoming maintenance tasks
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getUpcomingTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<PreventiveMaintenanceDto> tasks = preventiveMaintenanceService.getUpcomingTasks(page, size);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Get overdue maintenance tasks
     */
    @GetMapping("/overdue")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getOverdueTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<PreventiveMaintenanceDto> tasks = preventiveMaintenanceService.getOverdueTasks(page, size);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Get maintenance by maintenance code
     */
    @GetMapping("/code/{maintenanceCode}")
    public ResponseEntity<PreventiveMaintenanceDto> getMaintenanceByCode(@PathVariable String maintenanceCode) {
        PreventiveMaintenanceDto maintenance = preventiveMaintenanceService.getMaintenanceByCode(maintenanceCode);
        return ResponseEntity.ok(maintenance);
    }
    
    /**
     * Get maintenance by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getMaintenanceByStatus(@PathVariable String status) {
        List<PreventiveMaintenanceDto> maintenanceList = preventiveMaintenanceService.getMaintenanceByStatus(status);
        return ResponseEntity.ok(maintenanceList);
    }
    
    /**
     * Get maintenance by maintenance type
     */
    @GetMapping("/type/{maintenanceType}")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getMaintenanceByType(@PathVariable String maintenanceType) {
        List<PreventiveMaintenanceDto> maintenanceList = preventiveMaintenanceService.getMaintenanceByType(maintenanceType);
        return ResponseEntity.ok(maintenanceList);
    }
    
    /**
     * Get maintenance by frequency
     */
    @GetMapping("/frequency/{frequency}")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getMaintenanceByFrequency(@PathVariable String frequency) {
        List<PreventiveMaintenanceDto> maintenanceList = preventiveMaintenanceService.getMaintenanceByFrequency(frequency);
        return ResponseEntity.ok(maintenanceList);
    }
    
    /**
     * Get maintenance by priority
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getMaintenanceByPriority(@PathVariable String priority) {
        List<PreventiveMaintenanceDto> maintenanceList = preventiveMaintenanceService.getMaintenanceByPriority(priority);
        return ResponseEntity.ok(maintenanceList);
    }
    
    /**
     * Get maintenance by assigned to
     */
    @GetMapping("/assigned/{assignedTo}")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getMaintenanceByAssignedTo(@PathVariable String assignedTo) {
        List<PreventiveMaintenanceDto> maintenanceList = preventiveMaintenanceService.getMaintenanceByAssignedTo(assignedTo);
        return ResponseEntity.ok(maintenanceList);
    }
    
    /**
     * Get maintenance by scheduled date range
     */
    @GetMapping("/scheduled")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getMaintenanceByScheduledDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<PreventiveMaintenanceDto> maintenanceList = preventiveMaintenanceService.getMaintenanceByScheduledDateRange(startDate, endDate);
        return ResponseEntity.ok(maintenanceList);
    }
    
    /**
     * Get maintenance by next due date range
     */
    @GetMapping("/due")
    public ResponseEntity<List<PreventiveMaintenanceDto>> getMaintenanceByNextDueDateRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<PreventiveMaintenanceDto> maintenanceList = preventiveMaintenanceService.getMaintenanceByNextDueDateRange(startDate, endDate);
        return ResponseEntity.ok(maintenanceList);
    }
}