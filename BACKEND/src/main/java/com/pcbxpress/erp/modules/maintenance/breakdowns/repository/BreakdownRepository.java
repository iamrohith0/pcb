package com.pcbxpress.erp.modules.maintenance.breakdowns.repository;

import com.pcbxpress.erp.modules.maintenance.breakdowns.model.Breakdown;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Breakdown entity
 */
@Repository
public interface BreakdownRepository extends JpaRepository<Breakdown, UUID> {
    
    /**
     * Find breakdowns by equipment ID
     */
    List<Breakdown> findByEquipmentId(UUID equipmentId);
    
    /**
     * Find breakdowns by equipment code
     */
    List<Breakdown> findByEquipmentCode(String equipmentCode);
    
    /**
     * Find breakdowns by status
     */
    List<Breakdown> findByStatus(String status);
    
    /**
     * Find breakdowns by type
     */
    List<Breakdown> findByBreakdownType(String breakdownType);
    
    /**
     * Find breakdowns by severity
     */
    List<Breakdown> findBySeverity(String severity);
    
    /**
     * Find breakdowns by assigned technician
     */
    List<Breakdown> findByAssignedTo(String assignedTo);
    
    /**
     * Find breakdowns by reported by user
     */
    List<Breakdown> findByReportedBy(String reportedBy);
    
    /**
     * Find breakdowns within a date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByStartTimeBetween(@Param("startDate") LocalDateTime startDate, 
                                          @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment and status
     */
    List<Breakdown> findByEquipmentIdAndStatus(UUID equipmentId, String status);
    
    /**
     * Find breakdowns by equipment and type
     */
    List<Breakdown> findByEquipmentIdAndBreakdownType(UUID equipmentId, String breakdownType);
    
    /**
     * Find breakdowns by equipment and severity
     */
    List<Breakdown> findByEquipmentIdAndSeverity(UUID equipmentId, String severity);
    
    /**
     * Find breakdowns by equipment and assigned technician
     */
    List<Breakdown> findByEquipmentIdAndAssignedTo(UUID equipmentId, String assignedTo);
    
    /**
     * Find breakdowns by equipment and reported by user
     */
    List<Breakdown> findByEquipmentIdAndReportedBy(UUID equipmentId, String reportedBy);
    
    /**
     * Find breakdowns by equipment and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                        @Param("startDate") LocalDateTime startDate,
                                                        @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by status and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.status = :status AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByStatusAndStartTimeBetween(@Param("status") String status,
                                                   @Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by type and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.breakdownType = :breakdownType AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByBreakdownTypeAndStartTimeBetween(@Param("breakdownType") String breakdownType,
                                                          @Param("startDate") LocalDateTime startDate,
                                                          @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by severity and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.severity = :severity AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findBySeverityAndStartTimeBetween(@Param("severity") String severity,
                                                     @Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by assigned technician and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.assignedTo = :assignedTo AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByAssignedToAndStartTimeBetween(@Param("assignedTo") String assignedTo,
                                                       @Param("startDate") LocalDateTime startDate,
                                                       @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by reported by user and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.reportedBy = :reportedBy AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByReportedByAndStartTimeBetween(@Param("reportedBy") String reportedBy,
                                                       @Param("startDate") LocalDateTime startDate,
                                                       @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.status = :status AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStatusAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                 @Param("status") String status,
                                                                 @Param("startDate") LocalDateTime startDate,
                                                                 @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, type, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.breakdownType = :breakdownType AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndBreakdownTypeAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                        @Param("breakdownType") String breakdownType,
                                                                        @Param("startDate") LocalDateTime startDate,
                                                                        @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, severity, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.severity = :severity AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndSeverityAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                   @Param("severity") String severity,
                                                                   @Param("startDate") LocalDateTime startDate,
                                                                   @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, assigned technician, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.assignedTo = :assignedTo AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndAssignedToAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                     @Param("assignedTo") String assignedTo,
                                                                     @Param("startDate") LocalDateTime startDate,
                                                                     @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, reported by user, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.reportedBy = :reportedBy AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndReportedByAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                     @Param("reportedBy") String reportedBy,
                                                                     @Param("startDate") LocalDateTime startDate,
                                                                     @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by status, type, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.status = :status AND b.breakdownType = :breakdownType AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByStatusAndBreakdownTypeAndStartTimeBetween(@Param("status") String status,
                                                                   @Param("breakdownType") String breakdownType,
                                                                   @Param("startDate") LocalDateTime startDate,
                                                                   @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by status, severity, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.status = :status AND b.severity = :severity AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByStatusAndSeverityAndStartTimeBetween(@Param("status") String status,
                                                              @Param("severity") String severity,
                                                              @Param("startDate") LocalDateTime startDate,
                                                              @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by type, severity, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.breakdownType = :breakdownType AND b.severity = :severity AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByBreakdownTypeAndSeverityAndStartTimeBetween(@Param("breakdownType") String breakdownType,
                                                                     @Param("severity") String severity,
                                                                     @Param("startDate") LocalDateTime startDate,
                                                                     @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by assigned technician, reported by user, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.assignedTo = :assignedTo AND b.reportedBy = :reportedBy AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByAssignedToAndReportedByAndStartTimeBetween(@Param("assignedTo") String assignedTo,
                                                                    @Param("reportedBy") String reportedBy,
                                                                    @Param("startDate") LocalDateTime startDate,
                                                                    @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.status = :status AND b.breakdownType = :breakdownType AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStatusAndBreakdownTypeAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                 @Param("status") String status,
                                                                                 @Param("breakdownType") String breakdownType,
                                                                                 @Param("startDate") LocalDateTime startDate,
                                                                                 @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, severity, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.status = :status AND b.severity = :severity AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStatusAndSeverityAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                            @Param("status") String status,
                                                                            @Param("severity") String severity,
                                                                            @Param("startDate") LocalDateTime startDate,
                                                                            @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, type, severity, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.breakdownType = :breakdownType AND b.severity = :severity AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndBreakdownTypeAndSeverityAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                   @Param("breakdownType") String breakdownType,
                                                                                   @Param("severity") String severity,
                                                                                   @Param("startDate") LocalDateTime startDate,
                                                                                   @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, assigned technician, reported by user, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.assignedTo = :assignedTo AND b.reportedBy = :reportedBy AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndAssignedToAndReportedByAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                  @Param("assignedTo") String assignedTo,
                                                                                  @Param("reportedBy") String reportedBy,
                                                                                  @Param("startDate") LocalDateTime startDate,
                                                                                  @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by status, type, severity, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.status = :status AND b.breakdownType = :breakdownType AND b.severity = :severity AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByStatusAndBreakdownTypeAndSeverityAndStartTimeBetween(@Param("status") String status,
                                                                              @Param("breakdownType") String breakdownType,
                                                                              @Param("severity") String severity,
                                                                              @Param("startDate") LocalDateTime startDate,
                                                                              @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by assigned technician, reported by user, status, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.assignedTo = :assignedTo AND b.reportedBy = :reportedBy AND b.status = :status AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByAssignedToAndReportedByAndStatusAndStartTimeBetween(@Param("assignedTo") String assignedTo,
                                                                             @Param("reportedBy") String reportedBy,
                                                                             @Param("status") String status,
                                                                             @Param("startDate") LocalDateTime startDate,
                                                                             @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.status = :status AND b.breakdownType = :breakdownType AND b.severity = :severity AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                            @Param("status") String status,
                                                                                            @Param("breakdownType") String breakdownType,
                                                                                            @Param("severity") String severity,
                                                                                            @Param("startDate") LocalDateTime startDate,
                                                                                            @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, assigned technician, reported by user, status, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.assignedTo = :assignedTo AND b.reportedBy = :reportedBy AND b.status = :status AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndAssignedToAndReportedByAndStatusAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                           @Param("assignedTo") String assignedTo,
                                                                                           @Param("reportedBy") String reportedBy,
                                                                                           @Param("status") String status,
                                                                                           @Param("startDate") LocalDateTime startDate,
                                                                                           @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, assigned technician, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.status = :status AND b.breakdownType = :breakdownType AND b.severity = :severity AND b.assignedTo = :assignedTo AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                                         @Param("status") String status,
                                                                                                         @Param("breakdownType") String breakdownType,
                                                                                                         @Param("severity") String severity,
                                                                                                         @Param("assignedTo") String assignedTo,
                                                                                                         @Param("startDate") LocalDateTime startDate,
                                                                                                         @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, reported by user, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.status = :status AND b.breakdownType = :breakdownType AND b.severity = :severity AND b.reportedBy = :reportedBy AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndReportedByAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                                         @Param("status") String status,
                                                                                                         @Param("breakdownType") String breakdownType,
                                                                                                         @Param("severity") String severity,
                                                                                                         @Param("reportedBy") String reportedBy,
                                                                                                         @Param("startDate") LocalDateTime startDate,
                                                                                                         @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, assigned technician, reported by user, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.status = :status AND b.breakdownType = :breakdownType AND b.severity = :severity AND b.assignedTo = :assignedTo AND b.reportedBy = :reportedBy AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                                                     @Param("status") String status,
                                                                                                                     @Param("breakdownType") String breakdownType,
                                                                                                                     @Param("severity") String severity,
                                                                                                                     @Param("assignedTo") String assignedTo,
                                                                                                                     @Param("reportedBy") String reportedBy,
                                                                                                                     @Param("startDate") LocalDateTime startDate,
                                                                                                                     @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, assigned technician, reported by user, resolution, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.status = :status AND b.breakdownType = :breakdownType AND b.severity = :severity AND b.assignedTo = :assignedTo AND b.reportedBy = :reportedBy AND b.resolution = :resolution AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndResolutionAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                                                                  @Param("status") String status,
                                                                                                                                  @Param("breakdownType") String breakdownType,
                                                                                                                                  @Param("severity") String severity,
                                                                                                                                  @Param("assignedTo") String assignedTo,
                                                                                                                                  @Param("reportedBy") String reportedBy,
                                                                                                                                  @Param("resolution") String resolution,
                                                                                                                                  @Param("startDate") LocalDateTime startDate,
                                                                                                                                  @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, assigned technician, reported by user, root cause, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.status = :status AND b.breakdownType = :breakdownType AND b.severity = :severity AND b.assignedTo = :assignedTo AND b.reportedBy = :reportedBy AND b.rootCause = :rootCause AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndRootCauseAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                                                                @Param("status") String status,
                                                                                                                                @Param("breakdownType") String breakdownType,
                                                                                                                                @Param("severity") String severity,
                                                                                                                                @Param("assignedTo") String assignedTo,
                                                                                                                                @Param("reportedBy") String reportedBy,
                                                                                                                                @Param("rootCause") String rootCause,
                                                                                                                                @Param("startDate") LocalDateTime startDate,
                                                                                                                                @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find breakdowns by equipment, status, type, severity, assigned technician, reported by user, resolution, root cause, and date range
     */
    @Query("SELECT b FROM Breakdown b WHERE b.equipmentId = :equipmentId AND b.status = :status AND b.breakdownType = :breakdownType AND b.severity = :severity AND b.assignedTo = :assignedTo AND b.reportedBy = :reportedBy AND b.resolution = :resolution AND b.rootCause = :rootCause AND b.startTime BETWEEN :startDate AND :endDate")
    List<Breakdown> findByEquipmentIdAndStatusAndBreakdownTypeAndSeverityAndAssignedToAndReportedByAndResolutionAndRootCauseAndStartTimeBetween(@Param("equipmentId") UUID equipmentId,
                                                                                                                                           @Param("status") String status,
                                                                                                                                           @Param("breakdownType") String breakdownType,
                                                                                                                                           @Param("severity") String severity,
                                                                                                                                           @Param("assignedTo") String assignedTo,
                                                                                                                                           @Param("reportedBy") String reportedBy,
                                                                                                                                           @Param("resolution") String resolution,
                                                                                                                                           @Param("rootCause") String rootCause,
                                                                                                                                           @Param("startDate") LocalDateTime startDate,
                                                                                                                                           @Param("endDate") LocalDateTime endDate);
                                                                   
                                                                   // Count methods for statistics
                                                                   long countByStatus(String status);
                                                                   long countByBreakdownType(String breakdownType);
                                                                   long countBySeverity(String severity);
                                                                   long countByAssignedTo(String assignedTo);
                                                                   long countByReportedBy(String reportedBy);
                                                                   long countByEquipmentId(UUID equipmentId);
                                                                   long countByEquipmentIdAndStatus(UUID equipmentId, String status);
                                                                   long countByEquipmentIdAndBreakdownType(UUID equipmentId, String breakdownType);
                                                                   long countByEquipmentIdAndSeverity(UUID equipmentId, String severity);
                                                                   long countByEquipmentIdAndAssignedTo(UUID equipmentId, String assignedTo);
                                                                   long countByEquipmentIdAndReportedBy(UUID equipmentId, String reportedBy);
                                                               }