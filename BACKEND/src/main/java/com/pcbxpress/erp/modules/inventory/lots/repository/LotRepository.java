package com.pcbxpress.erp.modules.inventory.lots.repository;

import com.pcbxpress.erp.modules.inventory.lots.model.Lot;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Lot Management
 */
@Repository
public interface LotRepository extends JpaRepository<Lot, UUID> {
    
    /**
     * Find lot by lot number
     */
    Lot findByLotNumber(String lotNumber);
    
    /**
     * Find lots by item ID
     */
    List<Lot> findByItemId(UUID itemId);
    
    /**
     * Find lots by supplier ID
     */
    List<Lot> findBySupplierId(UUID supplierId);
    
    /**
     * Find lots by status
     */
    List<Lot> findByStatus(Lot.LotStatus status);
    
    /**
     * Find lots by quality status
     */
    List<Lot> findByQualityStatus(Lot.QualityStatus qualityStatus);
    
    /**
     * Find lot by lot number (case insensitive)
     */
    Lot findByLotNumberIgnoreCase(String lotNumber);
    
    /**
     * Check if lot number exists (excluding current lot)
     */
    boolean existsByLotNumberIgnoreCaseAndIdNot(String lotNumber, UUID id);
    
    /**
     * Find lots by parent lot ID
     */
    List<Lot> findByParentLotId(UUID parentLotId);
    
    /**
     * Find lots expiring within days
     */
    @Query("SELECT l FROM Lot l WHERE l.expirationDate IS NOT NULL AND l.expirationDate <= :expirationDate")
    List<Lot> findExpiringLots(@Param("expirationDate") OffsetDateTime expirationDate);
    
    /**
     * Find lots with low quantity
     */
    @Query("SELECT l FROM Lot l WHERE l.quantityAvailable < :threshold")
    List<Lot> findLowQuantityLots(@Param("threshold") BigDecimal threshold);
    
    /**
     * Find lots by item and status
     */
    List<Lot> findByItemIdAndStatus(UUID itemId, Lot.LotStatus status);
    
    /**
     * Find lots by item and quality status
     */
    List<Lot> findByItemIdAndQualityStatus(UUID itemId, Lot.QualityStatus qualityStatus);
    
    /**
     * Find lots received within date range
     */
    @Query("SELECT l FROM Lot l WHERE l.receivedDate >= :fromDate AND l.receivedDate <= :toDate")
    List<Lot> findLotsByReceivedDateRange(@Param("fromDate") OffsetDateTime fromDate,
                                        @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Find lots manufactured within date range
     */
    @Query("SELECT l FROM Lot l WHERE l.manufactureDate >= :fromDate AND l.manufactureDate <= :toDate")
    List<Lot> findLotsByManufactureDateRange(@Param("fromDate") OffsetDateTime fromDate,
                                           @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Get total quantity by item
     */
    @Query("SELECT SUM(l.quantityAvailable) FROM Lot l WHERE l.itemId = :itemId AND l.status = :status")
    BigDecimal getTotalQuantityByItem(@Param("itemId") UUID itemId, @Param("status") Lot.LotStatus status);
    
    /**
     * Get lot movements summary
     */
    @Query("SELECT l.itemId, l.lotNumber, l.status, " +
           "SUM(l.quantityReceived), SUM(l.quantityUsed), SUM(l.quantityScrapped) " +
           "FROM Lot l " +
           "WHERE l.receivedDate >= :fromDate AND l.receivedDate <= :toDate " +
           "GROUP BY l.itemId, l.lotNumber, l.status " +
           "ORDER BY l.receivedDate DESC")
    List<Object[]> getLotMovements(@Param("fromDate") OffsetDateTime fromDate,
                                  @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Find lots with genealogy relationships
     */
    @Query("SELECT l FROM Lot l WHERE l.parentLotId IS NOT NULL OR l.childLotIds IS NOT NULL")
    List<Lot> findLotsWithGenealogy();
    
    /**
     * Find lots in quarantine
     */
    @Query("SELECT l FROM Lot l WHERE l.status = :status OR l.qualityStatus = :qualityStatus")
    List<Lot> findQuarantineLots(@Param("status") Lot.LotStatus status,
                                @Param("qualityStatus") Lot.QualityStatus qualityStatus);
}