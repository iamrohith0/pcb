package com.pcbxpress.erp.modules.production.repository;

import com.pcbxpress.erp.modules.production.model.Operation;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Operations
 */
@Repository
public interface OperationRepository extends JpaRepository<Operation, UUID> {
    
    /**
     * Find operation by operation code (case insensitive)
     */
    Operation findByOperationCodeIgnoreCase(String operationCode);
    
    /**
     * Find operations by routing ID
     */
    List<Operation> findByRoutingId(UUID routingId);
    
    /**
     * Find operations by sequence number
     */
    List<Operation> findBySequenceNumber(Integer sequenceNumber);
    
    /**
     * Find operations by operation type
     */
    List<Operation> findByOperationType(Operation.OperationType operationType);
    
    /**
     * Find operations by machine type
     */
    List<Operation> findByMachineTypeIgnoreCase(String machineType);
    
    /**
     * Find operations by machine ID
     */
    List<Operation> findByMachineId(UUID machineId);
    
    /**
     * Find operations by critical status
     */
    List<Operation> findByIsCritical(boolean isCritical);
    
    /**
     * Find operations by inspection status
     */
    List<Operation> findByIsInspection(boolean isInspection);
    
    /**
     * Find operations by tooling requirement
     */
    List<Operation> findByRequiresTooling(boolean requiresTooling);
    
    /**
     * Find operations by tooling code
     */
    List<Operation> findByToolingCodeIgnoreCase(String toolingCode);
    
    /**
     * Find operations by routing ID and sequence number
     */
    List<Operation> findByRoutingIdAndSequenceNumber(UUID routingId, Integer sequenceNumber);
    
    /**
     * Find operations by routing ID ordered by sequence number
     */
    List<Operation> findByRoutingIdOrderBySequenceNumberAsc(UUID routingId);
    
    /**
     * Find operations by estimated time range
     */
    @Query("SELECT o FROM Operation o WHERE o.estimatedTime BETWEEN :minTime AND :maxTime")
    List<Operation> findByEstimatedTimeRange(@Param("minTime") Double minTime, @Param("maxTime") Double maxTime);
    
    /**
     * Find operations by estimated cost range
     */
    @Query("SELECT o FROM Operation o WHERE o.estimatedCost BETWEEN :minCost AND :maxCost")
    List<Operation> findByEstimatedCostRange(@Param("minCost") Double minCost, @Param("maxCost") Double maxCost);
    
    /**
     * Find operations by multiple criteria
     */
    @Query("SELECT o FROM Operation o WHERE " +
           "(:routingId IS NULL OR o.routingId = :routingId) " +
           "AND (:operationType IS NULL OR o.operationType = :operationType) " +
           "AND (:machineType IS NULL OR LOWER(o.machineType) = LOWER(:machineType)) " +
           "AND (:isCritical IS NULL OR o.isCritical = :isCritical) " +
           "AND (:isInspection IS NULL OR o.isInspection = :isInspection) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(o.operationCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(o.description) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<Operation> findByCriteria(@Param("routingId") UUID routingId,
                                  @Param("operationType") Operation.OperationType operationType,
                                  @Param("machineType") String machineType,
                                  @Param("isCritical") Boolean isCritical,
                                  @Param("isInspection") Boolean isInspection,
                                  @Param("searchText") String searchText);
    
    /**
     * Get operation statistics by type
     */
    @Query("SELECT o.operationType, COUNT(o) FROM Operation o GROUP BY o.operationType")
    List<Object[]> getOperationStatistics();
    
    /**
     * Find operations with high estimated time
     */
    @Query("SELECT o FROM Operation o WHERE o.estimatedTime > :threshold")
    List<Operation> findHighTimeOperations(@Param("threshold") Double threshold);
    
    /**
     * Find operations with high estimated cost
     */
    @Query("SELECT o FROM Operation o WHERE o.estimatedCost > :threshold")
    List<Operation> findHighCostOperations(@Param("threshold") Double threshold);
    
    /**
     * Find operations by machine type pattern
     */
    @Query("SELECT o FROM Operation o WHERE o.machineType LIKE :machinePattern")
    List<Operation> findByMachinePattern(@Param("machinePattern") String machinePattern);
    
    /**
     * Find operations requiring specific tooling
     */
    @Query("SELECT o FROM Operation o WHERE o.requiresTooling = true AND o.toolingCode LIKE :toolingPattern")
    List<Operation> findOperationsByToolingPattern(@Param("toolingPattern") String toolingPattern);
}