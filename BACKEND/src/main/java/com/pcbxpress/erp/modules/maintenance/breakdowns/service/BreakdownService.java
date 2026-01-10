package com.pcbxpress.erp.modules.maintenance.breakdowns.service;

import com.pcbxpress.erp.modules.maintenance.breakdowns.dto.BreakdownDto;
import com.pcbxpress.erp.modules.maintenance.breakdowns.dto.BreakdownPayload;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Breakdown operations
 */
public interface BreakdownService {
    
    /**
     * Create a new breakdown
     */
    BreakdownDto createBreakdown(BreakdownPayload payload);
    
    /**
     * Update an existing breakdown
     */
    BreakdownDto updateBreakdown(UUID id, BreakdownPayload payload);
    
    /**
     * Get breakdown by ID
     */
    BreakdownDto getBreakdownById(UUID id);
    
    /**
     * Get all breakdowns
     */
    List<BreakdownDto> getAllBreakdowns();
    
    /**
     * Get all breakdowns with pagination
     */
    Page<BreakdownDto> getAllBreakdowns(Pageable pageable);
    
    /**
     * Delete breakdown by ID
     */
    void deleteBreakdown(UUID id);
    
    /**
     * Find breakdowns by equipment ID
     */
    List<BreakdownDto> findByEquipmentId(UUID equipmentId);
    
    /**
     * Find breakdowns by equipment code
     */
    List<BreakdownDto> findByEquipmentCode(String equipmentCode);
    
    /**
     * Find breakdowns by status
     */
    List<BreakdownDto> findByStatus(String status);
    
    /**
     * Find breakdowns by type
     */
    List<BreakdownDto> findByBreakdownType(String breakdownType);
    
    /**
     * Find breakdowns by severity
     */
    List<BreakdownDto> findBySeverity(String severity);
    
    /**
     * Find breakdowns by assigned technician
     */
    List<BreakdownDto> findByAssignedTo(String assignedTo);
    
    /**
     * Find breakdowns by reported by user
     */
    List<BreakdownDto> findByReportedBy(String reportedBy);
    
    /**
     * Find breakdowns within a date range
     */
    List<BreakdownDto> findByStartTimeBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment and status
     */
    List<BreakdownDto> findByEquipmentIdAndStatus(UUID equipmentId, String status);
    
    /**
     * Find breakdowns by equipment and type
     */
    List<BreakdownDto> findByEquipmentIdAndBreakdownType(UUID equipmentId, String breakdownType);
    
    /**
     * Find breakdowns by equipment and severity
     */
    List<BreakdownDto> findByEquipmentIdAndSeverity(UUID equipmentId, String severity);
    
    /**
     * Find breakdowns by equipment and assigned technician
     */
    List<BreakdownDto> findByEquipmentIdAndAssignedTo(UUID equipmentId, String assignedTo);
    
    /**
     * Find breakdowns by equipment and reported by user
     */
    List<BreakdownDto> findByEquipmentIdAndReportedBy(UUID equipmentId, String reportedBy);
    
    /**
     * Find breakdowns by equipment and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStartTimeBetween(UUID equipmentId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by status and date range
     */
    List<BreakdownDto> findByStatusAndStartTimeBetween(String status, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by type and date range
     */
    List<BreakdownDto> findByBreakdownTypeAndStartTimeBetween(String breakdownType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by severity and date range
     */
    List<BreakdownDto> findBySeverityAndStartTimeBetween(String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by assigned technician and date range
     */
    List<BreakdownDto> findByAssignedToAndStartTimeBetween(String assignedTo, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by reported by user and date range
     */
    List<BreakdownDto> findByReportedByAndStartTimeBetween(String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStatusAndStartTimeBetween(UUID equipmentId, String status, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, type, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndBreakdownTypeAndStartTimeBetween(UUID equipmentId, String breakdownType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, severity, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndSeverityAndStartTimeBetween(UUID equipmentId, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, assigned technician, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndAssignedToAndStartTimeBetween(UUID equipmentId, String assignedTo, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, reported by user, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndReportedByAndStartTimeBetween(UUID equipmentId, String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by status, type, and date range
     */
    List<BreakdownDto> findByStatusAndBreakdownTypeAndStartTimeBetween(String status, String breakdownType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by status, severity, and date range
     */
    List<BreakdownDto> findByStatusAndSeverityAndStartTimeBetween(String status, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by type, severity, and date range
     */
    List<BreakdownDto> findByBreakdownTypeAndSeverityAndStartTimeBetween(String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by assigned technician, reported by user, and date range
     */
    List<BreakdownDto> findByAssignedToAndReportedByAndStartTimeBetween(String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, severity, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStatusAndSeverityAndStartTimeBetween(UUID equipmentId, String status, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, type, severity, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndBreakdownTypeAndSeverityAndStartTimeBetween(UUID equipmentId, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, assigned technician, reported by user, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndAssignedToAndReportedByAndStartTimeBetween(UUID equipmentId, String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by status, type, severity, and date range
     */
    List<BreakdownDto> findByStatusAndBreakdownTypeAndSeverityAndStartTimeBetween(String status, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by assigned technician, reported by user, status, and date range
     */
    List<BreakdownDto> findByAssignedToAndReportedByAndStatusAndStartTimeBetween(String assignedTo, String reportedBy, String status, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, assigned technician, reported by user, status, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndAssignedToAndReportedByAndStatusAndStartTimeBetween(UUID equipmentId, String assignedTo, String reportedBy, String status, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, assigned technician, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, reported by user, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndReportedByAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, assigned technician, reported by user, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, assigned technician, reported by user, resolution, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndResolutionAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String resolution, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, assigned technician, reported by user, root cause, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndRootCauseAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String rootCause, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, assigned technician, reported by user, resolution, root cause, and date range
     */
    List<BreakdownDto> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndResolutionAndRootCauseAndStartTimeBetween(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String resolution, String rootCause, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Calculate total downtime for a specific equipment
     */
    Long calculateTotalDowntimeForEquipment(UUID equipmentId);
    
    /**
     * Calculate total downtime for a specific equipment within a date range
     */
    Long calculateTotalDowntimeForEquipmentInRange(UUID equipmentId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Calculate total downtime for all equipment within a date range
     */
    Long calculateTotalDowntimeInRange(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by status
     */
    Long getBreakdownCountByStatus(String status);
    
    /**
     * Get breakdown count by type
     */
    Long getBreakdownCountByType(String breakdownType);
    
    /**
     * Get breakdown count by severity
     */
    Long getBreakdownCountBySeverity(String severity);
    
    /**
     * Get breakdown count by assigned technician
     */
    Long getBreakdownCountByAssignedTo(String assignedTo);
    
    /**
     * Get breakdown count by reported by user
     */
    Long getBreakdownCountByReportedBy(String reportedBy);
    
    /**
     * Get breakdown count by equipment
     */
    Long getBreakdownCountByEquipment(UUID equipmentId);
    
    /**
     * Get breakdown count by equipment and status
     */
    Long getBreakdownCountByEquipmentAndStatus(UUID equipmentId, String status);
    
    /**
     * Get breakdown count by equipment and type
     */
    Long getBreakdownCountByEquipmentAndType(UUID equipmentId, String breakdownType);
    
    /**
     * Get breakdown count by equipment and severity
     */
    Long getBreakdownCountByEquipmentAndSeverity(UUID equipmentId, String severity);
    
    /**
     * Get breakdown count by equipment and assigned technician
     */
    Long getBreakdownCountByEquipmentAndAssignedTo(UUID equipmentId, String assignedTo);
    
    /**
     * Get breakdown count by equipment and reported by user
     */
    Long getBreakdownCountByEquipmentAndReportedBy(UUID equipmentId, String reportedBy);
    
    /**
     * Get breakdown count by equipment within a date range
     */
    Long getBreakdownCountByEquipmentInRange(UUID equipmentId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by status within a date range
     */
    Long getBreakdownCountByStatusInRange(String status, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by type within a date range
     */
    Long getBreakdownCountByTypeInRange(String breakdownType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by severity within a date range
     */
    Long getBreakdownCountBySeverityInRange(String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by assigned technician within a date range
     */
    Long getBreakdownCountByAssignedToInRange(String assignedTo, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by reported by user within a date range
     */
    Long getBreakdownCountByReportedByInRange(String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, status, and date range
     */
    Long getBreakdownCountByEquipmentAndStatusInRange(UUID equipmentId, String status, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, type, and date range
     */
    Long getBreakdownCountByEquipmentAndTypeInRange(UUID equipmentId, String breakdownType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, severity, and date range
     */
    Long getBreakdownCountByEquipmentAndSeverityInRange(UUID equipmentId, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, assigned technician, and date range
     */
    Long getBreakdownCountByEquipmentAndAssignedToInRange(UUID equipmentId, String assignedTo, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, reported by user, and date range
     */
    Long getBreakdownCountByEquipmentAndReportedByInRange(UUID equipmentId, String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by status, type, and date range
     */
    Long getBreakdownCountByStatusAndTypeInRange(String status, String breakdownType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by status, severity, and date range
     */
    Long getBreakdownCountByStatusAndSeverityInRange(String status, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by type, severity, and date range
     */
    Long getBreakdownCountByTypeAndSeverityInRange(String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by assigned technician, reported by user, and date range
     */
    Long getBreakdownCountByAssignedToAndReportedByInRange(String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, status, type, and date range
     */
    Long getBreakdownCountByEquipmentAndStatusAndTypeInRange(UUID equipmentId, String status, String breakdownType, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, status, severity, and date range
     */
    Long getBreakdownCountByEquipmentAndStatusAndSeverityInRange(UUID equipmentId, String status, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, type, severity, and date range
     */
    Long getBreakdownCountByEquipmentAndTypeAndSeverityInRange(UUID equipmentId, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, assigned technician, reported by user, and date range
     */
    Long getBreakdownCountByEquipmentAndAssignedToAndReportedByInRange(UUID equipmentId, String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by status, type, severity, and date range
     */
    Long getBreakdownCountByStatusAndTypeAndSeverityInRange(String status, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by assigned technician, reported by user, status, and date range
     */
    Long getBreakdownCountByAssignedToAndReportedByAndStatusInRange(String assignedTo, String reportedBy, String status, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, status, type, severity, and date range
     */
    Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityInRange(UUID equipmentId, String status, String breakdownType, String severity, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, assigned technician, reported by user, status, and date range
     */
    Long getBreakdownCountByEquipmentAndAssignedToAndReportedByAndStatusInRange(UUID equipmentId, String assignedTo, String reportedBy, String status, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, status, type, severity, assigned technician, and date range
     */
    Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndAssignedToInRange(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, status, type, severity, reported by user, and date range
     */
    Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndReportedByInRange(UUID equipmentId, String status, String breakdownType, String severity, String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, status, type, severity, assigned technician, reported by user, and date range
     */
    Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndAssignedToAndReportedByInRange(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, status, type, severity, assigned technician, reported by user, resolution, and date range
     */
    Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndAssignedToAndReportedByAndResolutionInRange(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String resolution, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, status, type, severity, assigned technician, reported by user, root cause, and date range
     */
    Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndAssignedToAndReportedByAndRootCauseInRange(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String rootCause, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Get breakdown count by equipment, status, type, severity, assigned technician, reported by user, resolution, root cause, and date range
     */
    Long getBreakdownCountByEquipmentAndStatusAndTypeAndSeverityAndAssignedToAndReportedByAndResolutionAndRootCauseInRange(UUID equipmentId, String status, String breakdownType, String severity, String assignedTo, String reportedBy, String resolution, String rootCause, LocalDateTime startDate, LocalDateTime endDate);
}