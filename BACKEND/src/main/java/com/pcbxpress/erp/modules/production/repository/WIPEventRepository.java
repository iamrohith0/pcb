package com.pcbxpress.erp.modules.production.repository;

import com.pcbxpress.erp.modules.production.model.WIPEvent;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for WIP Events
 */
@Repository
public interface WIPEventRepository extends JpaRepository<WIPEvent, UUID> {
    
    /**
     * Find WIP events by work order ID
     */
    List<WIPEvent> findByWorkOrderId(UUID workOrderId);
    
    /**
     * Find WIP events by operation ID
     */
    List<WIPEvent> findByOperationId(UUID operationId);
    
    /**
     * Find WIP events by batch ID
     */
    List<WIPEvent> findByBatchIdIgnoreCase(String batchId);
    
    /**
     * Find WIP events by event type
     */
    List<WIPEvent> findByEventType(WIPEvent.EventType eventType);
    
    /**
     * Find WIP events by status
     */
    List<WIPEvent> findByStatus(WIPEvent.Status status);
    
    /**
     * Find WIP events by operator ID
     */
    List<WIPEvent> findByOperatorId(UUID operatorId);
    
    /**
     * Find WIP events by machine ID
     */
    List<WIPEvent> findByMachineId(UUID machineId);
    
    /**
     * Find WIP events by machine name
     */
    List<WIPEvent> findByMachineNameIgnoreCase(String machineName);
    
    /**
     * Find WIP events by operator name
     */
    List<WIPEvent> findByOperatorNameIgnoreCase(String operatorName);
    
    /**
     * Find WIP events by work order ID and event type
     */
    List<WIPEvent> findByWorkOrderIdAndEventType(UUID workOrderId, WIPEvent.EventType eventType);
    
    /**
     * Find WIP events by work order ID and status
     */
    List<WIPEvent> findByWorkOrderIdAndStatus(UUID workOrderId, WIPEvent.Status status);
    
    /**
     * Find WIP events by operation ID and event type
     */
    List<WIPEvent> findByOperationIdAndEventType(UUID operationId, WIPEvent.EventType eventType);
    
    /**
     * Find WIP events by time range
     */
    List<WIPEvent> findByStartTimeBetween(OffsetDateTime startTime, OffsetDateTime endTime);
    
    /**
     * Find WIP events by end time range
     */
    List<WIPEvent> findByEndTimeBetween(OffsetDateTime startTime, OffsetDateTime endTime);
    
    /**
     * Find WIP events by duration range
     */
    @Query("SELECT w FROM WIPEvent w WHERE w.durationMinutes BETWEEN :minDuration AND :maxDuration")
    List<WIPEvent> findByDurationRange(@Param("minDuration") Double minDuration, @Param("maxDuration") Double maxDuration);
    
    /**
     * Find WIP events by yield percentage range
     */
    @Query("SELECT w FROM WIPEvent w WHERE w.yieldPercentage BETWEEN :minYield AND :maxYield")
    List<WIPEvent> findByYieldRange(@Param("minYield") Double minYield, @Param("maxYield") Double maxYield);
    
    /**
     * Find WIP events by scrap quantity range
     */
    @Query("SELECT w FROM WIPEvent w WHERE w.scrapQuantity BETWEEN :minScrap AND :maxScrap")
    List<WIPEvent> findByScrapRange(@Param("minScrap") Integer minScrap, @Param("maxScrap") Integer maxScrap);
    
    /**
     * Find WIP events by rework quantity range
     */
    @Query("SELECT w FROM WIPEvent w WHERE w.reworkQuantity BETWEEN :minRework AND :maxRework")
    List<WIPEvent> findByReworkRange(@Param("minRework") Integer minRework, @Param("maxRework") Integer maxRework);
    
    /**
     * Find WIP events by multiple criteria
     */
    @Query("SELECT w FROM WIPEvent w WHERE " +
           "(:workOrderId IS NULL OR w.workOrderId = :workOrderId) " +
           "AND (:operationId IS NULL OR w.operationId = :operationId) " +
           "AND (:eventType IS NULL OR w.eventType = :eventType) " +
           "AND (:status IS NULL OR w.status = :status) " +
           "AND (:batchId IS NULL OR LOWER(w.batchId) LIKE LOWER(CONCAT('%', :batchId, '%'))) " +
           "AND (:machineName IS NULL OR LOWER(w.machineName) LIKE LOWER(CONCAT('%', :machineName, '%'))) " +
           "AND (:operatorName IS NULL OR LOWER(w.operatorName) LIKE LOWER(CONCAT('%', :operatorName, '%')))")
    List<WIPEvent> findByCriteria(@Param("workOrderId") UUID workOrderId,
                                 @Param("operationId") UUID operationId,
                                 @Param("eventType") WIPEvent.EventType eventType,
                                 @Param("status") WIPEvent.Status status,
                                 @Param("batchId") String batchId,
                                 @Param("machineName") String machineName,
                                 @Param("operatorName") String operatorName);
    
    /**
     * Get WIP event statistics by type
     */
    @Query("SELECT w.eventType, COUNT(w) FROM WIPEvent w GROUP BY w.eventType")
    List<Object[]> getWIPEventStatistics();
    
    /**
     * Get WIP event statistics by status
     */
    @Query("SELECT w.status, COUNT(w) FROM WIPEvent w GROUP BY w.status")
    List<Object[]> getWIPStatusStatistics();
    
    /**
     * Find WIP events with low yield
     */
    @Query("SELECT w FROM WIPEvent w WHERE w.yieldPercentage < :threshold")
    List<WIPEvent> findLowYieldEvents(@Param("threshold") Double threshold);
    
    /**
     * Find WIP events with high scrap
     */
    @Query("SELECT w FROM WIPEvent w WHERE w.scrapQuantity > :threshold")
    List<WIPEvent> findHighScrapEvents(@Param("threshold") Integer threshold);
    
    /**
     * Find WIP events with rework
     */
    @Query("SELECT w FROM WIPEvent w WHERE w.reworkQuantity > 0")
    List<WIPEvent> findReworkEvents();
    
    /**
     * Find WIP events by date range
     */
    @Query("SELECT w FROM WIPEvent w WHERE w.startTime BETWEEN :startDate AND :endDate")
    List<WIPEvent> findByDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
}