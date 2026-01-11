package com.pcbxpress.erp.modules.traceability.genealogy.repository;

import com.pcbxpress.erp.modules.traceability.genealogy.model.LotGenealogy;
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
 * Repository for Lot Genealogy entities
 */
@Repository
public interface LotGenealogyRepository extends JpaRepository<LotGenealogy, UUID> {
    
    /**
     * Find genealogy records by parent lot ID
     */
    List<LotGenealogy> findByParentLotId(UUID parentLotId);
    
    /**
     * Find genealogy records by child lot ID
     */
    List<LotGenealogy> findByChildLotId(UUID childLotId);
    
    /**
     * Find genealogy records by component ID
     */
    List<LotGenealogy> findByComponentId(UUID componentId);
    
    /**
     * Find genealogy records by relationship type
     */
    List<LotGenealogy> findByRelationshipType(LotGenealogy.RelationshipType relationshipType);
    
    /**
     * Find genealogy records by supplier ID
     */
    List<LotGenealogy> findBySupplierId(UUID supplierId);
    
    /**
     * Find genealogy records by warehouse ID
     */
    List<LotGenealogy> findByWarehouseId(UUID warehouseId);
    
    /**
     * Find genealogy records by location
     */
    List<LotGenealogy> findByLocation(String location);
    
    /**
     * Find genealogy records by active status
     */
    List<LotGenealogy> findByIsActive(boolean isActive);
    
    /**
     * Find genealogy records by production date range
     */
    List<LotGenealogy> findByProductionDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    /**
     * Find genealogy records by parent and child lot
     */
    List<LotGenealogy> findByParentLotIdAndChildLotId(UUID parentLotId, UUID childLotId);
    
    /**
     * Find genealogy records by criteria with pagination
     */
    @Query("SELECT g FROM LotGenealogy g WHERE " +
           "(:parentLotId IS NULL OR g.parentLotId = :parentLotId) AND " +
           "(:childLotId IS NULL OR g.childLotId = :childLotId) AND " +
           "(:componentId IS NULL OR g.componentId = :componentId) AND " +
           "(:relationshipType IS NULL OR g.relationshipType = :relationshipType) AND " +
           "(:isActive IS NULL OR g.isActive = :isActive) AND " +
           "(:query IS NULL OR LOWER(g.location) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(g.notes) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<LotGenealogy> findByCriteria(@Param("parentLotId") UUID parentLotId,
                                      @Param("childLotId") UUID childLotId,
                                      @Param("componentId") UUID componentId,
                                      @Param("relationshipType") LotGenealogy.RelationshipType relationshipType,
                                      @Param("isActive") Boolean isActive,
                                      @Param("query") String query,
                                      Pageable pageable);
    
    /**
     * Find genealogy records by component ID and relationship type
     */
    List<LotGenealogy> findByComponentIdAndRelationshipType(UUID componentId, LotGenealogy.RelationshipType relationshipType);
    
    /**
     * Find genealogy records by supplier ID and relationship type
     */
    List<LotGenealogy> findBySupplierIdAndRelationshipType(UUID supplierId, LotGenealogy.RelationshipType relationshipType);
    
    /**
     * Count genealogy records by active status
     */
    long countByIsActive(boolean isActive);
    
    /**
     * Find genealogy tree for a specific lot
     */
    @Query("SELECT g FROM LotGenealogy g WHERE g.parentLotId = :lotId OR g.childLotId = :lotId")
    List<LotGenealogy> findGenealogyTree(@Param("lotId") UUID lotId);
    
    /**
     * Find upstream traceability (components used to make this lot)
     */
    @Query("SELECT g FROM LotGenealogy g WHERE g.childLotId = :lotId")
    List<LotGenealogy> findUpstreamTraceability(@Param("lotId") UUID lotId);
    
    /**
     * Find downstream traceability (lots made from this lot)
     */
    @Query("SELECT g FROM LotGenealogy g WHERE g.parentLotId = :lotId")
    List<LotGenealogy> findDownstreamTraceability(@Param("lotId") UUID lotId);
    
    /**
     * Count genealogy records by relationship type
     */
    long countByRelationshipType(LotGenealogy.RelationshipType relationshipType);
    
    /**
     * Count genealogy records by parent lot ID
     */
    long countByParentLotId(UUID parentLotId);
    
    /**
     * Count genealogy records by child lot ID
     */
    long countByChildLotId(UUID childLotId);
    
    /**
     * Count genealogy records by component ID
     */
    long countByComponentId(UUID componentId);
}