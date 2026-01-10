package com.pcbxpress.erp.modules.inventory.stock.repository;

import com.pcbxpress.erp.modules.inventory.stock.model.Stock;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Stock Management
 */
@Repository
public interface StockRepository extends JpaRepository<Stock, UUID> {
    
    /**
     * Find stock by item ID
     */
    List<Stock> findByItemId(UUID itemId);
    
    /**
     * Find stock by warehouse ID
     */
    List<Stock> findByWarehouseId(UUID warehouseId);
    
    /**
     * Find stock by location ID
     */
    List<Stock> findByLocationId(UUID locationId);
    
    /**
     * Find stock by lot ID
     */
    List<Stock> findByLotId(UUID lotId);
    
    /**
     * Find stock by serial ID
     */
    List<Stock> findBySerialId(UUID serialId);
    
    /**
     * Find stock by item and warehouse
     */
    List<Stock> findByItemIdAndWarehouseId(UUID itemId, UUID warehouseId);
    
    /**
     * Find stock with available quantity greater than zero
     */
    List<Stock> findByAvailableQuantityGreaterThan(BigDecimal quantity);
    
    /**
     * Find stock with low quantity (below minimum threshold)
     */
    List<Stock> findByAvailableQuantityLessThan(BigDecimal quantity);
    
    /**
     * Find stock by status
     */
    List<Stock> findByStockStatus(Stock.StockStatus status);
    
    /**
     * Find stock by item and status
     */
    List<Stock> findByItemIdAndStockStatus(UUID itemId, Stock.StockStatus status);
    
    /**
     * Find stock expiring within days
     */
    @Query("SELECT s FROM Stock s WHERE s.expirationDate IS NOT NULL AND s.expirationDate <= :expirationDate")
    List<Stock> findExpiringStock(@Param("expirationDate") OffsetDateTime expirationDate);
    
    /**
     * Find stock with no movements since date
     */
    @Query("SELECT s FROM Stock s WHERE s.lastMovementDate IS NULL OR s.lastMovementDate < :lastMovementDate")
    List<Stock> findInactiveStock(@Param("lastMovementDate") OffsetDateTime lastMovementDate);
    
    /**
     * Get total quantity by item
     */
    @Query("SELECT SUM(s.quantity) FROM Stock s WHERE s.itemId = :itemId")
    BigDecimal getTotalQuantityByItem(@Param("itemId") UUID itemId);
    
    /**
     * Get available quantity by item
     */
    @Query("SELECT SUM(s.availableQuantity) FROM Stock s WHERE s.itemId = :itemId")
    BigDecimal getAvailableQuantityByItem(@Param("itemId") UUID itemId);
    
    /**
     * Get total value by item
     */
    @Query("SELECT SUM(s.totalValue) FROM Stock s WHERE s.itemId = :itemId")
    BigDecimal getTotalValueByItem(@Param("itemId") UUID itemId);
    
    /**
     * Get stock summary by item
     */
    @Query("SELECT new com.pcbxpress.erp.modules.inventory.stock.dto.StockSummaryDto(" +
           "s.itemId, i.name, i.itemCode, " +
           "SUM(s.quantity), SUM(s.reservedQuantity), SUM(s.availableQuantity), " +
           "SUM(s.onOrderQuantity), SUM(s.committedQuantity), SUM(s.totalValue), " +
           "COUNT(DISTINCT s.warehouseId), COUNT(DISTINCT s.locationId)) " +
           "FROM Stock s JOIN Item i ON s.itemId = i.id " +
           "GROUP BY s.itemId, i.name, i.itemCode")
    List<Object[]> getStockSummary();
    
    /**
     * Get stock alerts (low stock, expired, etc.)
     */
    @Query("SELECT s FROM Stock s WHERE " +
           "s.availableQuantity < 0 OR " +
           "(s.expirationDate IS NOT NULL AND s.expirationDate <= :alertDate) OR " +
           "(s.lastMovementDate IS NOT NULL AND s.lastMovementDate < :inactiveDate)")
    List<Stock> getStockAlerts(@Param("alertDate") OffsetDateTime alertDate, 
                              @Param("inactiveDate") OffsetDateTime inactiveDate);
    
    /**
     * Find stock movements summary
     */
    @Query("SELECT s.itemId, s.warehouseId, s.locationId, s.stockStatus, " +
           "SUM(s.quantity), COUNT(s.id) " +
           "FROM Stock s " +
           "WHERE s.lastMovementDate >= :fromDate AND s.lastMovementDate <= :toDate " +
           "GROUP BY s.itemId, s.warehouseId, s.locationId, s.stockStatus " +
           "ORDER BY s.lastMovementDate DESC")
    List<Object[]> getStockMovements(@Param("fromDate") OffsetDateTime fromDate,
                                    @Param("toDate") OffsetDateTime toDate);
}