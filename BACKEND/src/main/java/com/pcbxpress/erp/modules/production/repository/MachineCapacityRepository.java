package com.pcbxpress.erp.modules.production.repository;

import com.pcbxpress.erp.modules.production.model.MachineCapacity;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Machine Capacity
 */
@Repository
public interface MachineCapacityRepository extends JpaRepository<MachineCapacity, UUID> {
    
    /**
     * Find machine capacity by machine ID
     */
    List<MachineCapacity> findByMachineId(UUID machineId);
    
    /**
     * Find machine capacity by machine name
     */
    List<MachineCapacity> findByMachineNameIgnoreCase(String machineName);
    
    /**
     * Find machine capacity by machine type
     */
    List<MachineCapacity> findByMachineTypeIgnoreCase(String machineType);
    
    /**
     * Find machine capacity by date
     */
    List<MachineCapacity> findByDate(LocalDate date);
    
    /**
     * Find machine capacity by shift
     */
    List<MachineCapacity> findByShift(MachineCapacity.Shift shift);
    
    /**
     * Find machine capacity by status
     */
    List<MachineCapacity> findByStatus(MachineCapacity.Status status);
    
    /**
     * Find machine capacity by work order ID
     */
    List<MachineCapacity> findByWorkOrderId(UUID workOrderId);
    
    /**
     * Find machine capacity by operation ID
     */
    List<MachineCapacity> findByOperationId(UUID operationId);
    
    /**
     * Find machine capacity by date and shift
     */
    List<MachineCapacity> findByDateAndShift(LocalDate date, MachineCapacity.Shift shift);
    
    /**
     * Find machine capacity by machine ID and date
     */
    List<MachineCapacity> findByMachineIdAndDate(UUID machineId, LocalDate date);
    
    /**
     * Find machine capacity by machine ID and date range
     */
    List<MachineCapacity> findByMachineIdAndDateBetween(UUID machineId, LocalDate startDate, LocalDate endDate);
    
    /**
     * Find machine capacity by utilization percentage range
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.utilizationPercentage BETWEEN :minUtilization AND :maxUtilization")
    List<MachineCapacity> findByUtilizationRange(@Param("minUtilization") Double minUtilization, @Param("maxUtilization") Double maxUtilization);
    
    /**
     * Find machine capacity by OEE availability range
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.oeeAvailability BETWEEN :minOEE AND :maxOEE")
    List<MachineCapacity> findByOEEAvailabilityRange(@Param("minOEE") Double minOEE, @Param("maxOEE") Double maxOEE);
    
    /**
     * Find machine capacity by OEE performance range
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.oeePerformance BETWEEN :minOEE AND :maxOEE")
    List<MachineCapacity> findByOEEPerformanceRange(@Param("minOEE") Double minOEE, @Param("maxOEE") Double maxOEE);
    
    /**
     * Find machine capacity by OEE quality range
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.oeeQuality BETWEEN :minOEE AND :maxOEE")
    List<MachineCapacity> findByOEEQualityRange(@Param("minOEE") Double minOEE, @Param("maxOEE") Double maxOEE);
    
    /**
     * Find machine capacity by OEE overall range
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.oeeOverall BETWEEN :minOEE AND :maxOEE")
    List<MachineCapacity> findByOEEOverallRange(@Param("minOEE") Double minOEE, @Param("maxOEE") Double maxOEE);
    
    /**
     * Find machine capacity by downtime range
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.downtimeMinutes BETWEEN :minDowntime AND :maxDowntime")
    List<MachineCapacity> findByDowntimeRange(@Param("minDowntime") Double minDowntime, @Param("maxDowntime") Double maxDowntime);
    
    /**
     * Find machine capacity by maintenance hours range
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.maintenanceHours BETWEEN :minHours AND :maxHours")
    List<MachineCapacity> findByMaintenanceHoursRange(@Param("minHours") Double minHours, @Param("maxHours") Double maxHours);
    
    /**
     * Find machine capacity by breakdown hours range
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.breakdownHours BETWEEN :minHours AND :maxHours")
    List<MachineCapacity> findByBreakdownHoursRange(@Param("minHours") Double minHours, @Param("maxHours") Double maxHours);
    
    /**
     * Find machine capacity by multiple criteria
     */
    @Query("SELECT m FROM MachineCapacity m WHERE " +
           "(:machineId IS NULL OR m.machineId = :machineId) " +
           "AND (:machineType IS NULL OR LOWER(m.machineType) = LOWER(:machineType)) " +
           "AND (:date IS NULL OR m.date = :date) " +
           "AND (:shift IS NULL OR m.shift = :shift) " +
           "AND (:status IS NULL OR m.status = :status) " +
           "AND (:workOrderId IS NULL OR m.workOrderId = :workOrderId) " +
           "AND (:operationId IS NULL OR m.operationId = :operationId)")
    List<MachineCapacity> findByCriteria(@Param("machineId") UUID machineId,
                                        @Param("machineType") String machineType,
                                        @Param("date") LocalDate date,
                                        @Param("shift") MachineCapacity.Shift shift,
                                        @Param("status") MachineCapacity.Status status,
                                        @Param("workOrderId") UUID workOrderId,
                                        @Param("operationId") UUID operationId);
    
    /**
     * Get machine capacity statistics by status
     */
    @Query("SELECT m.status, COUNT(m) FROM MachineCapacity m GROUP BY m.status")
    List<Object[]> getMachineCapacityStatistics();
    
    /**
     * Get machine utilization statistics
     */
    @Query("SELECT m.machineName, AVG(m.utilizationPercentage) FROM MachineCapacity m GROUP BY m.machineName")
    List<Object[]> getMachineUtilizationStatistics();
    
    /**
     * Get machine OEE statistics
     */
    @Query("SELECT m.machineName, AVG(m.oeeOverall) FROM MachineCapacity m GROUP BY m.machineName")
    List<Object[]> getMachineOEEStatistics();
    
    /**
     * Find machine capacity with high utilization
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.utilizationPercentage > :threshold")
    List<MachineCapacity> findHighUtilizationMachines(@Param("threshold") Double threshold);
    
    /**
     * Find machine capacity with low utilization
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.utilizationPercentage < :threshold")
    List<MachineCapacity> findLowUtilizationMachines(@Param("threshold") Double threshold);
    
    /**
     * Find machine capacity with high downtime
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.downtimeMinutes > :threshold")
    List<MachineCapacity> findHighDowntimeMachines(@Param("threshold") Double threshold);
    
    /**
     * Find machine capacity by date range
     */
    @Query("SELECT m FROM MachineCapacity m WHERE m.date BETWEEN :startDate AND :endDate")
    List<MachineCapacity> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}