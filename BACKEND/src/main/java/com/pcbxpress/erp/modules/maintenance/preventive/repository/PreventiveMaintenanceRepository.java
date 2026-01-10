package com.pcbxpress.erp.modules.maintenance.preventive.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pcbxpress.erp.modules.maintenance.preventive.model.PreventiveMaintenance;

/**
 * Repository interface for PreventiveMaintenance entity
 */
@Repository
public interface PreventiveMaintenanceRepository extends JpaRepository<PreventiveMaintenance, UUID> {
    
    /**
     * Find preventive maintenance by maintenance code
     */
    PreventiveMaintenance findByMaintenanceCode(String maintenanceCode);
    
    /**
     * Find preventive maintenance by equipment ID
     */
    List<PreventiveMaintenance> findByEquipmentId(UUID equipmentId);
    
    /**
     * Find preventive maintenance by equipment code
     */
    List<PreventiveMaintenance> findByEquipmentCode(String equipmentCode);
    
    /**
     * Find preventive maintenance by status
     */
    List<PreventiveMaintenance> findByStatus(String status);
    
    /**
     * Find preventive maintenance by maintenance type
     */
    List<PreventiveMaintenance> findByMaintenanceType(String maintenanceType);
    
    /**
     * Find preventive maintenance by frequency
     */
    List<PreventiveMaintenance> findByFrequency(String frequency);
    
    /**
     * Find preventive maintenance by priority
     */
    List<PreventiveMaintenance> findByPriority(String priority);
    
    /**
     * Find preventive maintenance by assigned to
     */
    List<PreventiveMaintenance> findByAssignedTo(String assignedTo);
    
    /**
     * Find preventive maintenance by status and equipment ID
     */
    List<PreventiveMaintenance> findByStatusAndEquipmentId(String status, UUID equipmentId);
    
    /**
     * Find preventive maintenance by status and equipment code
     */
    List<PreventiveMaintenance> findByStatusAndEquipmentCode(String status, String equipmentCode);
    
    /**
     * Find preventive maintenance by maintenance type and equipment ID
     */
    List<PreventiveMaintenance> findByMaintenanceTypeAndEquipmentId(String maintenanceType, UUID equipmentId);
    
    /**
     * Find preventive maintenance by maintenance type and equipment code
     */
    List<PreventiveMaintenance> findByMaintenanceTypeAndEquipmentCode(String maintenanceType, String equipmentCode);
    
    /**
     * Find preventive maintenance by frequency and equipment ID
     */
    List<PreventiveMaintenance> findByFrequencyAndEquipmentId(String frequency, UUID equipmentId);
    
    /**
     * Find preventive maintenance by frequency and equipment code
     */
    List<PreventiveMaintenance> findByFrequencyAndEquipmentCode(String frequency, String equipmentCode);
    
    /**
     * Find preventive maintenance by priority and equipment ID
     */
    List<PreventiveMaintenance> findByPriorityAndEquipmentId(String priority, UUID equipmentId);
    
    /**
     * Find preventive maintenance by priority and equipment code
     */
    List<PreventiveMaintenance> findByPriorityAndEquipmentCode(String priority, String equipmentCode);
    
    /**
     * Find preventive maintenance by assigned to and equipment ID
     */
    List<PreventiveMaintenance> findByAssignedToAndEquipmentId(String assignedTo, UUID equipmentId);
    
    /**
     * Find preventive maintenance by assigned to and equipment code
     */
    List<PreventiveMaintenance> findByAssignedToAndEquipmentCode(String assignedTo, String equipmentCode);
    
    /**
     * Find preventive maintenance by status and frequency
     */
    List<PreventiveMaintenance> findByStatusAndFrequency(String status, String frequency);
    
    /**
     * Find preventive maintenance by status and assigned to
     */
    List<PreventiveMaintenance> findByStatusAndAssignedTo(String status, String assignedTo);
    
    /**
     * Find preventive maintenance by maintenance type and frequency
     */
    List<PreventiveMaintenance> findByMaintenanceTypeAndFrequency(String maintenanceType, String frequency);
    
    /**
     * Find preventive maintenance by maintenance type and priority
     */
    List<PreventiveMaintenance> findByMaintenanceTypeAndPriority(String maintenanceType, String priority);
    
    /**
     * Find preventive maintenance by maintenance type and assigned to
     */
    List<PreventiveMaintenance> findByMaintenanceTypeAndAssignedTo(String maintenanceType, String assignedTo);
    
    /**
     * Find preventive maintenance by frequency and priority
     */
    List<PreventiveMaintenance> findByFrequencyAndPriority(String frequency, String priority);
    
    /**
     * Find preventive maintenance by frequency and assigned to
     */
    List<PreventiveMaintenance> findByFrequencyAndAssignedTo(String frequency, String assignedTo);
    
    /**
     * Find preventive maintenance by priority and assigned to
     */
    List<PreventiveMaintenance> findByPriorityAndAssignedTo(String priority, String assignedTo);
    
    /**
     * Find preventive maintenance by status, equipment ID, and maintenance type
     */
    List<PreventiveMaintenance> findByStatusAndEquipmentIdAndMaintenanceType(String status, UUID equipmentId, String maintenanceType);
    
    /**
     * Find preventive maintenance by status, equipment code, and maintenance type
     */
    List<PreventiveMaintenance> findByStatusAndEquipmentCodeAndMaintenanceType(String status, String equipmentCode, String maintenanceType);
    
    /**
     * Find preventive maintenance by scheduled date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.scheduledDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByScheduledDateBetween(@Param("startDate") LocalDateTime startDate,
                                                          @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by last performed date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.lastPerformedDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByLastPerformedDateBetween(@Param("startDate") LocalDateTime startDate,
                                                              @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by next due date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.nextDueDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByNextDueDateBetween(@Param("startDate") LocalDateTime startDate,
                                                        @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by status and scheduled date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.status = :status AND p.scheduledDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByStatusAndScheduledDateBetween(@Param("status") String status,
                                                                   @Param("startDate") LocalDateTime startDate,
                                                                   @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by equipment ID and scheduled date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.equipmentId = :equipmentId AND p.scheduledDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByEquipmentIdAndScheduledDateBetween(@Param("equipmentId") UUID equipmentId,
                                                                        @Param("startDate") LocalDateTime startDate,
                                                                        @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by equipment code and scheduled date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.equipmentCode = :equipmentCode AND p.scheduledDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByEquipmentCodeAndScheduledDateBetween(@Param("equipmentCode") String equipmentCode,
                                                                          @Param("startDate") LocalDateTime startDate,
                                                                          @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by status and next due date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.status = :status AND p.nextDueDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByStatusAndNextDueDateBetween(@Param("status") String status,
                                                                 @Param("startDate") LocalDateTime startDate,
                                                                 @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by equipment ID and next due date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.equipmentId = :equipmentId AND p.nextDueDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByEquipmentIdAndNextDueDateBetween(@Param("equipmentId") UUID equipmentId,
                                                                      @Param("startDate") LocalDateTime startDate,
                                                                      @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by equipment code and next due date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.equipmentCode = :equipmentCode AND p.nextDueDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByEquipmentCodeAndNextDueDateBetween(@Param("equipmentCode") String equipmentCode,
                                                                        @Param("startDate") LocalDateTime startDate,
                                                                        @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by status and last performed date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.status = :status AND p.lastPerformedDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByStatusAndLastPerformedDateBetween(@Param("status") String status,
                                                                       @Param("startDate") LocalDateTime startDate,
                                                                       @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by equipment ID and last performed date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.equipmentId = :equipmentId AND p.lastPerformedDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByEquipmentIdAndLastPerformedDateBetween(@Param("equipmentId") UUID equipmentId,
                                                                            @Param("startDate") LocalDateTime startDate,
                                                                            @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by equipment code and last performed date range
     */
    @Query("SELECT p FROM PreventiveMaintenance p WHERE p.equipmentCode = :equipmentCode AND p.lastPerformedDate BETWEEN :startDate AND :endDate")
    List<PreventiveMaintenance> findByEquipmentCodeAndLastPerformedDateBetween(@Param("equipmentCode") String equipmentCode,
                                                                              @Param("startDate") LocalDateTime startDate,
                                                                              @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find preventive maintenance by equipment ID, status, and priority
     */
    List<PreventiveMaintenance> findByEquipmentIdAndStatusAndPriority(UUID equipmentId, String status, String priority);
    
    /**
     * Find preventive maintenance by equipment code, status, and priority
     */
    List<PreventiveMaintenance> findByEquipmentCodeAndStatusAndPriority(String equipmentCode, String status, String priority);
    
    /**
     * Find preventive maintenance by equipment ID, status, and maintenance type
     */
    List<PreventiveMaintenance> findByEquipmentIdAndStatusAndMaintenanceType(UUID equipmentId, String status, String maintenanceType);
    
    /**
     * Find preventive maintenance by equipment code, status, and maintenance type
     */
    List<PreventiveMaintenance> findByEquipmentCodeAndStatusAndMaintenanceType(String equipmentCode, String status, String maintenanceType);
}