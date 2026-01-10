package com.pcbxpress.erp.modules.inventory.bom.repository;

import com.pcbxpress.erp.modules.inventory.bom.model.Bom;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for BOM Management
 */
@Repository
public interface BomRepository extends JpaRepository<Bom, UUID> {
    
    /**
     * Find BOM by BOM number
     */
    Bom findByBomNumber(String bomNumber);
    
    /**
     * Find BOMs by product item ID
     */
    List<Bom> findByProductItemId(UUID productItemId);
    
    /**
     * Find BOMs by status
     */
    List<Bom> findByStatus(Bom.BomStatus status);
    
    /**
     * Find BOMs by revision
     */
    List<Bom> findByRevision(String revision);
    
    /**
     * Find BOMs by version
     */
    List<Bom> findByVersion(String version);
    
    /**
     * Find active BOMs
     */
    List<Bom> findByStatusAndEffectiveDateLessThanEqual(Bom.BomStatus status, OffsetDateTime date);
    
    /**
     * Find BOMs by product item and status
     */
    List<Bom> findByProductItemIdAndStatus(UUID productItemId, Bom.BomStatus status);
    
    /**
     * Find BOMs by product item and revision
     */
    List<Bom> findByProductItemIdAndRevision(UUID productItemId, String revision);
    
    /**
     * Find BOMs by product item and version
     */
    List<Bom> findByProductItemIdAndVersion(UUID productItemId, String version);
    
    /**
     * Find BOMs effective on a specific date
     */
    @Query("SELECT b FROM Bom b WHERE b.effectiveDate <= :date AND (b.endDate IS NULL OR b.endDate > :date)")
    List<Bom> findBomsEffectiveOnDate(@Param("date") OffsetDateTime date);
    
    /**
     * Find BOMs by engineer
     */
    List<Bom> findByEngineer(String engineer);
    
    /**
     * Find BOMs by approver
     */
    List<Bom> findByApprover(String approver);
    
    /**
     * Find BOMs by date range
     */
    @Query("SELECT b FROM Bom b WHERE b.effectiveDate >= :fromDate AND b.effectiveDate <= :toDate")
    List<Bom> findBomsByDateRange(@Param("fromDate") OffsetDateTime fromDate,
                                 @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Find BOMs by product item and date range
     */
    @Query("SELECT b FROM Bom b WHERE b.productItemId = :productItemId AND b.effectiveDate >= :fromDate AND b.effectiveDate <= :toDate")
    List<Bom> findBomsByProductItemAndDateRange(@Param("productItemId") UUID productItemId,
                                              @Param("fromDate") OffsetDateTime fromDate,
                                              @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Find latest BOM for a product item
     */
    @Query("SELECT b FROM Bom b WHERE b.productItemId = :productItemId AND b.status = :status ORDER BY b.effectiveDate DESC, b.revision DESC")
    List<Bom> findLatestBomsByProductItem(@Param("productItemId") UUID productItemId,
                                        @Param("status") Bom.BomStatus status);
    
    /**
     * Find BOMs with components count
     */
    @Query("SELECT b.id, b.bomNumber, b.description, COUNT(bc) as componentCount " +
           "FROM Bom b LEFT JOIN BomComponent bc ON b.id = bc.bomId " +
           "GROUP BY b.id, b.bomNumber, b.description")
    List<Object[]> getBomsWithComponentCount();
}