package com.pcbxpress.erp.modules.traceability.recall.repository;

import com.pcbxpress.erp.modules.traceability.recall.model.Recall;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Recall entities
 */
@Repository
public interface RecallRepository extends JpaRepository<Recall, UUID> {
    
    /**
     * Find recalls by case number
     */
    Recall findByCaseNumber(String caseNumber);
    
    /**
     * Check if case number exists (excluding given ID)
     */
    boolean existsByCaseNumberIgnoreCaseAndIdNot(String caseNumber, UUID id);
    
    /**
     * Find recalls by product ID
     */
    List<Recall> findByProductId(UUID productId);
    
    /**
     * Find recalls by batch ID
     */
    List<Recall> findByBatchId(UUID batchId);
    
    /**
     * Find recalls by lot ID
     */
    List<Recall> findByLotId(UUID lotId);
    
    /**
     * Find recalls by recall type
     */
    List<Recall> findByRecallType(Recall.RecallType recallType);
    
    /**
     * Find recalls by severity
     */
    List<Recall> findBySeverity(Recall.Severity severity);
    
    /**
     * Find recalls by status
     */
    List<Recall> findByStatus(Recall.RecallStatus status);
    
    /**
     * Find recalls by initiated date range
     */
    List<Recall> findByInitiatedDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    /**
     * Find recalls by effective date range
     */
    List<Recall> findByEffectiveDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    /**
     * Find recalls by initiated by user
     */
    List<Recall> findByInitiatedBy(String initiatedBy);
    
    /**
     * Find recalls by approved by user
     */
    List<Recall> findByApprovedBy(String approvedBy);
    
    /**
     * Find recalls by active status
     */
    List<Recall> findByIsActive(boolean isActive);
    
    /**
     * Find recalls by customer notification required
     */
    List<Recall> findByCustomerNotificationRequired(boolean customerNotificationRequired);
    
    /**
     * Find recalls by regulatory notification required
     */
    List<Recall> findByRegulatoryNotificationRequired(boolean regulatoryNotificationRequired);
    
    /**
     * Find recalls by criteria with pagination
     */
    @Query("SELECT r FROM Recall r WHERE " +
           "(:productId IS NULL OR r.productId = :productId) AND " +
           "(:batchId IS NULL OR r.batchId = :batchId) AND " +
           "(:lotId IS NULL OR r.lotId = :lotId) AND " +
           "(:recallType IS NULL OR r.recallType = :recallType) AND " +
           "(:severity IS NULL OR r.severity = :severity) AND " +
           "(:status IS NULL OR r.status = :status) AND " +
           "(:isActive IS NULL OR r.isActive = :isActive) AND " +
           "(:query IS NULL OR LOWER(r.caseNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.reason) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Recall> findByCriteria(@Param("productId") UUID productId,
                                @Param("batchId") UUID batchId,
                                @Param("lotId") UUID lotId,
                                @Param("recallType") Recall.RecallType recallType,
                                @Param("severity") Recall.Severity severity,
                                @Param("status") Recall.RecallStatus status,
                                @Param("isActive") Boolean isActive,
                                @Param("query") String query,
                                Pageable pageable);
    
    /**
     * Find recalls by date range with pagination
     */
    @Query("SELECT r FROM Recall r WHERE r.initiatedDate BETWEEN :startDate AND :endDate")
    Page<Recall> findByDateRange(@Param("startDate") OffsetDateTime startDate,
                                 @Param("endDate") OffsetDateTime endDate,
                                 Pageable pageable);
    
    /**
     * Find active recalls
     */
    @Query("SELECT r FROM Recall r WHERE r.status IN :activeStatuses AND r.isActive = true")
    List<Recall> findActiveRecalls(@Param("activeStatuses") List<Recall.RecallStatus> activeStatuses);
    
    /**
     * Find recalls by severity and status
     */
    @Query("SELECT r FROM Recall r WHERE r.severity = :severity AND r.status = :status")
    List<Recall> findBySeverityAndStatus(@Param("severity") Recall.Severity severity,
                                         @Param("status") Recall.RecallStatus status);
    
    /**
     * Count recalls by status
     */
    long countByStatus(Recall.RecallStatus status);
    
    /**
     * Count recalls by recall type
     */
    long countByRecallType(Recall.RecallType recallType);
    
    /**
     * Count recalls by severity
     */
    long countBySeverity(Recall.Severity severity);
    
    /**
     * Count recalls by product ID
     */
    long countByProductId(UUID productId);
    
    /**
     * Count recalls by batch ID
     */
    long countByBatchId(UUID batchId);
    
    /**
     * Count recalls by lot ID
     */
    long countByLotId(UUID lotId);
}