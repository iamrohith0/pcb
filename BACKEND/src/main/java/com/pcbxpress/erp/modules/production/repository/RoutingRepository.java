package com.pcbxpress.erp.modules.production.repository;

import com.pcbxpress.erp.modules.production.model.Routing;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Routings
 */
@Repository
public interface RoutingRepository extends JpaRepository<Routing, UUID> {
    
    /**
     * Find routing by routing code (case insensitive)
     */
    Routing findByRoutingCodeIgnoreCase(String routingCode);
    
    /**
     * Find routings by item code
     */
    List<Routing> findByItemCodeIgnoreCase(String itemCode);
    
    /**
     * Find routings by status
     */
    List<Routing> findByStatus(Routing.RoutingStatus status);
    
    /**
     * Find active routings
     */
    List<Routing> findByIsActiveTrue();
    
    /**
     * Find default routings
     */
    List<Routing> findByIsDefaultTrue();
    
    /**
     * Find routings by item code and active status
     */
    List<Routing> findByItemCodeIgnoreCaseAndIsActiveTrue(String itemCode);
    
    /**
     * Find routings by item code and default status
     */
    List<Routing> findByItemCodeIgnoreCaseAndIsDefaultTrue(String itemCode);
    
    /**
     * Find routings by version
     */
    List<Routing> findByVersion(Integer version);
    
    /**
     * Find latest version of routing for an item
     */
    @Query("SELECT r FROM Routing r WHERE r.itemCode = :itemCode AND r.version = " +
           "(SELECT MAX(r2.version) FROM Routing r2 WHERE r2.itemCode = :itemCode)")
    List<Routing> findLatestVersionByItemCode(@Param("itemCode") String itemCode);
    
    /**
     * Find default routing for an item
     */
    @Query("SELECT r FROM Routing r WHERE r.itemCode = :itemCode AND r.isDefault = true AND r.isActive = true")
    List<Routing> findDefaultByItemCode(@Param("itemCode") String itemCode);
    
    /**
     * Find routings by multiple criteria
     */
    @Query("SELECT r FROM Routing r WHERE " +
           "(:itemCode IS NULL OR LOWER(r.itemCode) = LOWER(:itemCode)) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "AND (:isActive IS NULL OR r.isActive = :isActive) " +
           "AND (:isDefault IS NULL OR r.isDefault = :isDefault) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(r.routingCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<Routing> findByCriteria(@Param("itemCode") String itemCode,
                                @Param("status") Routing.RoutingStatus status,
                                @Param("isActive") Boolean isActive,
                                @Param("isDefault") Boolean isDefault,
                                @Param("searchText") String searchText);
    
    /**
     * Get routing statistics
     */
    @Query("SELECT r.status, COUNT(r) FROM Routing r GROUP BY r.status")
    List<Object[]> getRoutingStatistics();
    
    /**
     * Find routings by estimated total time range
     */
    @Query("SELECT r FROM Routing r WHERE r.estimatedTotalTime BETWEEN :minTime AND :maxTime")
    List<Routing> findByEstimatedTimeRange(@Param("minTime") Double minTime, @Param("maxTime") Double maxTime);
    
    /**
     * Find routings by estimated total cost range
     */
    @Query("SELECT r FROM Routing r WHERE r.estimatedTotalCost BETWEEN :minCost AND :maxCost")
    List<Routing> findByEstimatedCostRange(@Param("minCost") Double minCost, @Param("maxCost") Double maxCost);
    
    /**
     * Find routings with high estimated cost
     */
    @Query("SELECT r FROM Routing r WHERE r.estimatedTotalCost > :threshold")
    List<Routing> findHighCostRoutings(@Param("threshold") Double threshold);
    
    /**
     * Find routings by item type (through item code pattern)
     */
    @Query("SELECT r FROM Routing r WHERE r.itemCode LIKE :itemPattern")
    List<Routing> findByItemPattern(@Param("itemPattern") String itemPattern);
}