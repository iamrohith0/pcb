package com.pcbxpress.erp.modules.maintenance.breakdowns.controller;

import com.pcbxpress.erp.modules.maintenance.breakdowns.dto.BreakdownDto;
import com.pcbxpress.erp.modules.maintenance.breakdowns.dto.BreakdownPayload;
import com.pcbxpress.erp.modules.maintenance.breakdowns.service.BreakdownService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for Breakdown operations
 */
@RestController
@RequestMapping("/api/maintenance/breakdowns")
public class BreakdownController {
    
    @Autowired
    private BreakdownService breakdownService;
    
    /**
     * Create a new breakdown
     */
    @PostMapping
    public ResponseEntity<BreakdownDto> createBreakdown(@RequestBody BreakdownPayload payload) {
        BreakdownDto createdBreakdown = breakdownService.createBreakdown(payload);
        return ResponseEntity.ok(createdBreakdown);
    }
    
    /**
     * Update an existing breakdown
     */
    @PutMapping("/{id}")
    public ResponseEntity<BreakdownDto> updateBreakdown(@PathVariable UUID id, @RequestBody BreakdownPayload payload) {
        BreakdownDto updatedBreakdown = breakdownService.updateBreakdown(id, payload);
        return ResponseEntity.ok(updatedBreakdown);
    }
    
    /**
     * Get breakdown by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<BreakdownDto> getBreakdownById(@PathVariable UUID id) {
        BreakdownDto breakdown = breakdownService.getBreakdownById(id);
        return ResponseEntity.ok(breakdown);
    }
    
    /**
     * Get all breakdowns
     */
    @GetMapping
    public ResponseEntity<List<BreakdownDto>> getAllBreakdowns() {
        List<BreakdownDto> breakdowns = breakdownService.getAllBreakdowns();
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Get all breakdowns with pagination
     */
    @GetMapping("/page")
    public ResponseEntity<Page<BreakdownDto>> getAllBreakdowns(Pageable pageable) {
        Page<BreakdownDto> breakdowns = breakdownService.getAllBreakdowns(pageable);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Delete breakdown by ID
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBreakdown(@PathVariable UUID id) {
        breakdownService.deleteBreakdown(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Find breakdowns by equipment ID
     */
    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<BreakdownDto>> findByEquipmentId(@PathVariable UUID equipmentId) {
        List<BreakdownDto> breakdowns = breakdownService.findByEquipmentId(equipmentId);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by equipment code
     */
    @GetMapping("/equipment-code/{equipmentCode}")
    public ResponseEntity<List<BreakdownDto>> findByEquipmentCode(@PathVariable String equipmentCode) {
        List<BreakdownDto> breakdowns = breakdownService.findByEquipmentCode(equipmentCode);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BreakdownDto>> findByStatus(@PathVariable String status) {
        List<BreakdownDto> breakdowns = breakdownService.findByStatus(status);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by type
     */
    @GetMapping("/type/{breakdownType}")
    public ResponseEntity<List<BreakdownDto>> findByBreakdownType(@PathVariable String breakdownType) {
        List<BreakdownDto> breakdowns = breakdownService.findByBreakdownType(breakdownType);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by severity
     */
    @GetMapping("/severity/{severity}")
    public ResponseEntity<List<BreakdownDto>> findBySeverity(@PathVariable String severity) {
        List<BreakdownDto> breakdowns = breakdownService.findBySeverity(severity);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by assigned technician
     */
    @GetMapping("/assigned-to/{assignedTo}")
    public ResponseEntity<List<BreakdownDto>> findByAssignedTo(@PathVariable String assignedTo) {
        List<BreakdownDto> breakdowns = breakdownService.findByAssignedTo(assignedTo);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by reported by user
     */
    @GetMapping("/reported-by/{reportedBy}")
    public ResponseEntity<List<BreakdownDto>> findByReportedBy(@PathVariable String reportedBy) {
        List<BreakdownDto> breakdowns = breakdownService.findByReportedBy(reportedBy);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns within a date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<BreakdownDto>> findByStartTimeBetween(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<BreakdownDto> breakdowns = breakdownService.findByStartTimeBetween(startDate, endDate);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by equipment and status
     */
    @GetMapping("/equipment/{equipmentId}/status/{status}")
    public ResponseEntity<List<BreakdownDto>> findByEquipmentIdAndStatus(
            @PathVariable UUID equipmentId,
            @PathVariable String status) {
        List<BreakdownDto> breakdowns = breakdownService.findByEquipmentIdAndStatus(equipmentId, status);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by equipment and type
     */
    @GetMapping("/equipment/{equipmentId}/type/{breakdownType}")
    public ResponseEntity<List<BreakdownDto>> findByEquipmentIdAndBreakdownType(
            @PathVariable UUID equipmentId,
            @PathVariable String breakdownType) {
        List<BreakdownDto> breakdowns = breakdownService.findByEquipmentIdAndBreakdownType(equipmentId, breakdownType);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by equipment and severity
     */
    @GetMapping("/equipment/{equipmentId}/severity/{severity}")
    public ResponseEntity<List<BreakdownDto>> findByEquipmentIdAndSeverity(
            @PathVariable UUID equipmentId,
            @PathVariable String severity) {
        List<BreakdownDto> breakdowns = breakdownService.findByEquipmentIdAndSeverity(equipmentId, severity);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by equipment and assigned technician
     */
    @GetMapping("/equipment/{equipmentId}/assigned-to/{assignedTo}")
    public ResponseEntity<List<BreakdownDto>> findByEquipmentIdAndAssignedTo(
            @PathVariable UUID equipmentId,
            @PathVariable String assignedTo) {
        List<BreakdownDto> breakdowns = breakdownService.findByEquipmentIdAndAssignedTo(equipmentId, assignedTo);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by equipment and reported by user
     */
    @GetMapping("/equipment/{equipmentId}/reported-by/{reportedBy}")
    public ResponseEntity<List<BreakdownDto>> findByEquipmentIdAndReportedBy(
            @PathVariable UUID equipmentId,
            @PathVariable String reportedBy) {
        List<BreakdownDto> breakdowns = breakdownService.findByEquipmentIdAndReportedBy(equipmentId, reportedBy);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by equipment and date range
     */
    @GetMapping("/equipment/{equipmentId}/date-range")
    public ResponseEntity<List<BreakdownDto>> findByEquipmentIdAndStartTimeBetween(
            @PathVariable UUID equipmentId,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<BreakdownDto> breakdowns = breakdownService.findByEquipmentIdAndStartTimeBetween(equipmentId, startDate, endDate);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by status and date range
     */
    @GetMapping("/status/{status}/date-range")
    public ResponseEntity<List<BreakdownDto>> findByStatusAndStartTimeBetween(
            @PathVariable String status,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<BreakdownDto> breakdowns = breakdownService.findByStatusAndStartTimeBetween(status, startDate, endDate);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by type and date range
     */
    @GetMapping("/type/{breakdownType}/date-range")
    public ResponseEntity<List<BreakdownDto>> findByBreakdownTypeAndStartTimeBetween(
            @PathVariable String breakdownType,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<BreakdownDto> breakdowns = breakdownService.findByBreakdownTypeAndStartTimeBetween(breakdownType, startDate, endDate);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by severity and date range
     */
    @GetMapping("/severity/{severity}/date-range")
    public ResponseEntity<List<BreakdownDto>> findBySeverityAndStartTimeBetween(
            @PathVariable String severity,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<BreakdownDto> breakdowns = breakdownService.findBySeverityAndStartTimeBetween(severity, startDate, endDate);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by assigned technician and date range
     */
    @GetMapping("/assigned-to/{assignedTo}/date-range")
    public ResponseEntity<List<BreakdownDto>> findByAssignedToAndStartTimeBetween(
            @PathVariable String assignedTo,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<BreakdownDto> breakdowns = breakdownService.findByAssignedToAndStartTimeBetween(assignedTo, startDate, endDate);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Find breakdowns by reported by user and date range
     */
    @GetMapping("/reported-by/{reportedBy}/date-range")
    public ResponseEntity<List<BreakdownDto>> findByReportedByAndStartTimeBetween(
            @PathVariable String reportedBy,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        List<BreakdownDto> breakdowns = breakdownService.findByReportedByAndStartTimeBetween(reportedBy, startDate, endDate);
        return ResponseEntity.ok(breakdowns);
    }
    
    /**
     * Calculate total downtime for a specific equipment
     */
    @GetMapping("/equipment/{equipmentId}/total-downtime")
    public ResponseEntity<Long> calculateTotalDowntimeForEquipment(@PathVariable UUID equipmentId) {
        Long totalDowntime = breakdownService.calculateTotalDowntimeForEquipment(equipmentId);
        return ResponseEntity.ok(totalDowntime);
    }
    
    /**
     * Calculate total downtime for a specific equipment within a date range
     */
    @GetMapping("/equipment/{equipmentId}/total-downtime/date-range")
    public ResponseEntity<Long> calculateTotalDowntimeForEquipmentInRange(
            @PathVariable UUID equipmentId,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        Long totalDowntime = breakdownService.calculateTotalDowntimeForEquipmentInRange(equipmentId, startDate, endDate);
        return ResponseEntity.ok(totalDowntime);
    }
    
    /**
     * Calculate total downtime for all equipment within a date range
     */
    @GetMapping("/total-downtime/date-range")
    public ResponseEntity<Long> calculateTotalDowntimeInRange(
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        Long totalDowntime = breakdownService.calculateTotalDowntimeInRange(startDate, endDate);
        return ResponseEntity.ok(totalDowntime);
    }
    
    /**
     * Get breakdown count by status
     */
    @GetMapping("/count/status/{status}")
    public ResponseEntity<Long> getBreakdownCountByStatus(@PathVariable String status) {
        Long count = breakdownService.getBreakdownCountByStatus(status);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by type
     */
    @GetMapping("/count/type/{breakdownType}")
    public ResponseEntity<Long> getBreakdownCountByType(@PathVariable String breakdownType) {
        Long count = breakdownService.getBreakdownCountByType(breakdownType);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by severity
     */
    @GetMapping("/count/severity/{severity}")
    public ResponseEntity<Long> getBreakdownCountBySeverity(@PathVariable String severity) {
        Long count = breakdownService.getBreakdownCountBySeverity(severity);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by assigned technician
     */
    @GetMapping("/count/assigned-to/{assignedTo}")
    public ResponseEntity<Long> getBreakdownCountByAssignedTo(@PathVariable String assignedTo) {
        Long count = breakdownService.getBreakdownCountByAssignedTo(assignedTo);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by reported by user
     */
    @GetMapping("/count/reported-by/{reportedBy}")
    public ResponseEntity<Long> getBreakdownCountByReportedBy(@PathVariable String reportedBy) {
        Long count = breakdownService.getBreakdownCountByReportedBy(reportedBy);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by equipment
     */
    @GetMapping("/count/equipment/{equipmentId}")
    public ResponseEntity<Long> getBreakdownCountByEquipment(@PathVariable UUID equipmentId) {
        Long count = breakdownService.getBreakdownCountByEquipment(equipmentId);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by equipment and status
     */
    @GetMapping("/count/equipment/{equipmentId}/status/{status}")
    public ResponseEntity<Long> getBreakdownCountByEquipmentAndStatus(
            @PathVariable UUID equipmentId,
            @PathVariable String status) {
        Long count = breakdownService.getBreakdownCountByEquipmentAndStatus(equipmentId, status);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by equipment and type
     */
    @GetMapping("/count/equipment/{equipmentId}/type/{breakdownType}")
    public ResponseEntity<Long> getBreakdownCountByEquipmentAndType(
            @PathVariable UUID equipmentId,
            @PathVariable String breakdownType) {
        Long count = breakdownService.getBreakdownCountByEquipmentAndType(equipmentId, breakdownType);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by equipment and severity
     */
    @GetMapping("/count/equipment/{equipmentId}/severity/{severity}")
    public ResponseEntity<Long> getBreakdownCountByEquipmentAndSeverity(
            @PathVariable UUID equipmentId,
            @PathVariable String severity) {
        Long count = breakdownService.getBreakdownCountByEquipmentAndSeverity(equipmentId, severity);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by equipment and assigned technician
     */
    @GetMapping("/count/equipment/{equipmentId}/assigned-to/{assignedTo}")
    public ResponseEntity<Long> getBreakdownCountByEquipmentAndAssignedTo(
            @PathVariable UUID equipmentId,
            @PathVariable String assignedTo) {
        Long count = breakdownService.getBreakdownCountByEquipmentAndAssignedTo(equipmentId, assignedTo);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by equipment and reported by user
     */
    @GetMapping("/count/equipment/{equipmentId}/reported-by/{reportedBy}")
    public ResponseEntity<Long> getBreakdownCountByEquipmentAndReportedBy(
            @PathVariable UUID equipmentId,
            @PathVariable String reportedBy) {
        Long count = breakdownService.getBreakdownCountByEquipmentAndReportedBy(equipmentId, reportedBy);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by equipment within a date range
     */
    @GetMapping("/count/equipment/{equipmentId}/date-range")
    public ResponseEntity<Long> getBreakdownCountByEquipmentInRange(
            @PathVariable UUID equipmentId,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        Long count = breakdownService.getBreakdownCountByEquipmentInRange(equipmentId, startDate, endDate);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by status within a date range
     */
    @GetMapping("/count/status/{status}/date-range")
    public ResponseEntity<Long> getBreakdownCountByStatusInRange(
            @PathVariable String status,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        Long count = breakdownService.getBreakdownCountByStatusInRange(status, startDate, endDate);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by type within a date range
     */
    @GetMapping("/count/type/{breakdownType}/date-range")
    public ResponseEntity<Long> getBreakdownCountByTypeInRange(
            @PathVariable String breakdownType,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        Long count = breakdownService.getBreakdownCountByTypeInRange(breakdownType, startDate, endDate);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by severity within a date range
     */
    @GetMapping("/count/severity/{severity}/date-range")
    public ResponseEntity<Long> getBreakdownCountBySeverityInRange(
            @PathVariable String severity,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        Long count = breakdownService.getBreakdownCountBySeverityInRange(severity, startDate, endDate);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by assigned technician within a date range
     */
    @GetMapping("/count/assigned-to/{assignedTo}/date-range")
    public ResponseEntity<Long> getBreakdownCountByAssignedToInRange(
            @PathVariable String assignedTo,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        Long count = breakdownService.getBreakdownCountByAssignedToInRange(assignedTo, startDate, endDate);
        return ResponseEntity.ok(count);
    }
    
    /**
     * Get breakdown count by reported by user within a date range
     */
    @GetMapping("/count/reported-by/{reportedBy}/date-range")
    public ResponseEntity<Long> getBreakdownCountByReportedByInRange(
            @PathVariable String reportedBy,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        Long count = breakdownService.getBreakdownCountByReportedByInRange(reportedBy, startDate, endDate);
        return ResponseEntity.ok(count);
    }
}