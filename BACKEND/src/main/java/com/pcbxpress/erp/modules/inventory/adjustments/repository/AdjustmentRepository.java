package com.pcbxpress.erp.modules.inventory.adjustments.repository;

import com.pcbxpress.erp.modules.inventory.adjustments.model.Adjustment;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Adjustment Management
 */
@Repository
public interface AdjustmentRepository extends JpaRepository<Adjustment, UUID> {
    
    /**
     * Find adjustment by adjustment number
     */
    Adjustment findByAdjustmentNumber(String adjustmentNumber);
    
    /**
     * Find adjustments by item ID
     */
    List<Adjustment> findByItemId(UUID itemId);
    
    /**
     * Find adjustments by warehouse ID
     */
    List<Adjustment> findByWarehouseId(UUID warehouseId);
    
    /**
     * Find adjustments by lot ID
     */
    List<Adjustment> findByLotId(UUID lotId);
    
    /**
     * Find adjustments by serial ID
     */
    List<Adjustment> findBySerialId(UUID serialId);
    
    /**
     * Find adjustments by status
     */
    List<Adjustment> findByStatus(Adjustment.AdjustmentStatus status);
    
    /**
     * Find adjustments by type
     */
    List<Adjustment> findByAdjustmentType(Adjustment.AdjustmentType adjustmentType);
    
    /**
     * Find adjustments by item and status
     */
    List<Adjustment> findByItemIdAndStatus(UUID itemId, Adjustment.AdjustmentStatus status);
    
    /**
     * Find adjustments by item and type
     */
    List<Adjustment> findByItemIdAndAdjustmentType(UUID itemId, Adjustment.AdjustmentType adjustmentType);
    
    /**
     * Find adjustments by warehouse and status
     */
    List<Adjustment> findByWarehouseIdAndStatus(UUID warehouseId, Adjustment.AdjustmentStatus status);
    
    /**
     * Find adjustments by date range
     */
    @Query("SELECT a FROM Adjustment a WHERE a.createdAt >= :fromDate AND a.createdAt <= :toDate")
    List<Adjustment> findAdjustmentsByDateRange(@Param("fromDate") OffsetDateTime fromDate,
                                              @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Find adjustments by item and date range
     */
    @Query("SELECT a FROM Adjustment a WHERE a.itemId = :itemId AND a.createdAt >= :fromDate AND a.createdAt <= :toDate")
    List<Adjustment> findAdjustmentsByItemAndDateRange(@Param("itemId") UUID itemId,
                                                     @Param("fromDate") OffsetDateTime fromDate,
                                                     @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Find adjustments by type and date range
     */
    @Query("SELECT a FROM Adjustment a WHERE a.adjustmentType = :adjustmentType AND a.createdAt >= :fromDate AND a.createdAt <= :toDate")
    List<Adjustment> findAdjustmentsByTypeAndDateRange(@Param("adjustmentType") Adjustment.AdjustmentType adjustmentType,
                                                     @Param("fromDate") OffsetDateTime fromDate,
                                                     @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Get total adjustment value by item
     */
    @Query("SELECT SUM(a.totalValue) FROM Adjustment a WHERE a.itemId = :itemId AND a.status = :status")
    BigDecimal getTotalAdjustmentValueByItem(@Param("itemId") UUID itemId, @Param("status") Adjustment.AdjustmentStatus status);
    
    /**
     * Get adjustment count by type
     */
    @Query("SELECT a.adjustmentType, COUNT(a) FROM Adjustment a WHERE a.createdAt >= :fromDate AND a.createdAt <= :toDate GROUP BY a.adjustmentType")
    List<Object[]> getAdjustmentCountByType(@Param("fromDate") OffsetDateTime fromDate,
                                          @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Get adjustment summary by item
     */
    @Query("SELECT a.itemId, a.adjustmentType, SUM(a.quantityDifference), SUM(a.totalValue) " +
           "FROM Adjustment a " +
           "WHERE a.createdAt >= :fromDate AND a.createdAt <= :toDate " +
           "GROUP BY a.itemId, a.adjustmentType")
    List<Object[]> getAdjustmentSummaryByItem(@Param("fromDate") OffsetDateTime fromDate,
                                            @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Find adjustments requiring approval
     */
    List<Adjustment> findByStatusAndAdjustmentType(Adjustment.AdjustmentStatus status,
                                                  Adjustment.AdjustmentType adjustmentType);
}