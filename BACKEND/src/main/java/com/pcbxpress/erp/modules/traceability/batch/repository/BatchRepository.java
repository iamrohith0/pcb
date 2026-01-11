package com.pcbxpress.erp.modules.traceability.batch.repository;

import com.pcbxpress.erp.modules.traceability.batch.model.Batch;
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
 * Repository for Batch entities
 */
@Repository
public interface BatchRepository extends JpaRepository<Batch, UUID> {
    
    /**
     * Find batches by item ID
     */
    List<Batch> findByItemId(UUID itemId);
    
    /**
     * Find batches by batch number
     */
    Batch findByBatchNumber(String batchNumber);
    
    /**
     * Check if batch number exists (excluding given ID)
     */
    boolean existsByBatchNumberIgnoreCaseAndIdNot(String batchNumber, UUID id);
    
    /**
     * Find batches by status
     */
    List<Batch> findByStatus(Batch.BatchStatus status);
    
    /**
     * Find batches by production date range
     */
    List<Batch> findByProductionDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    /**
     * Find batches by expiry date range
     */
    List<Batch> findByExpiryDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    /**
     * Find batches by warehouse ID
     */
    List<Batch> findByWarehouseId(UUID warehouseId);
    
    /**
     * Find batches by supplier ID
     */
    List<Batch> findBySupplierId(UUID supplierId);
    
    /**
     * Find batches by lot number
     */
    List<Batch> findByLotNumber(String lotNumber);
    
    /**
     * Find batches by location
     */
    List<Batch> findByLocation(String location);
    
    /**
     * Find batches by active status
     */
    List<Batch> findByIsActive(boolean isActive);
    
    /**
     * Find batches that are expired (expiry date is before current date)
     */
    @Query("SELECT b FROM Batch b WHERE b.expiryDate < :currentDate AND b.status != :status")
    List<Batch> findExpiredBatches(@Param("currentDate") OffsetDateTime currentDate, 
                                   @Param("status") Batch.BatchStatus status);
    
    /**
     * Find batches that need reorder (quantity below reorder level)
     */
    @Query("SELECT b FROM Batch b WHERE b.quantity <= :threshold AND b.status = :status")
    List<Batch> findBatchesNeedingReorder(@Param("threshold") Integer threshold, 
                                          @Param("status") Batch.BatchStatus status);
    
    /**
     * Find batches by criteria with pagination
     */
    @Query("SELECT b FROM Batch b WHERE " +
           "(:itemId IS NULL OR b.itemId = :itemId) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:isActive IS NULL OR b.isActive = :isActive) AND " +
           "(:query IS NULL OR LOWER(b.batchNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.lotNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.location) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Batch> findByCriteria(@Param("itemId") UUID itemId,
                               @Param("status") Batch.BatchStatus status,
                               @Param("isActive") Boolean isActive,
                               @Param("query") String query,
                               Pageable pageable);
    
    /**
     * Find batches by production date range with pagination
     */
    @Query("SELECT b FROM Batch b WHERE b.productionDate BETWEEN :startDate AND :endDate")
    Page<Batch> findByProductionDateRange(@Param("startDate") OffsetDateTime startDate,
                                          @Param("endDate") OffsetDateTime endDate,
                                          Pageable pageable);
    
    /**
     * Find batches by expiry date range with pagination
     */
    @Query("SELECT b FROM Batch b WHERE b.expiryDate BETWEEN :startDate AND :endDate")
    Page<Batch> findByExpiryDateRange(@Param("startDate") OffsetDateTime startDate,
                                      @Param("endDate") OffsetDateTime endDate,
                                      Pageable pageable);
    
    /**
     * Count batches by status
     */
    long countByStatus(Batch.BatchStatus status);
    
    /**
     * Count batches by item ID
     */
    long countByItemId(UUID itemId);
    
    /**
     * Count batches by warehouse ID
     */
    long countByWarehouseId(UUID warehouseId);
    
    /**
     * Count batches by supplier ID
     */
    long countBySupplierId(UUID supplierId);
}