package com.pcbxpress.erp.modules.warehouse.picking.repository;

import com.pcbxpress.erp.modules.warehouse.picking.model.Picking;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Picking entities
 */
@Repository
public interface PickingRepository extends JpaRepository<Picking, UUID> {
    
    /**
     * Find picking by code (case insensitive)
     */
    Picking findByCodeIgnoreCase(String code);
    
    /**
     * Check if picking code exists (excluding current picking)
     */
    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
    
    /**
     * Find pickings by warehouse ID
     */
    List<Picking> findByWarehouseId(UUID warehouseId);
    
    /**
     * Find pickings by warehouse name
     */
    List<Picking> findByWarehouseNameIgnoreCase(String warehouseName);
    
    /**
     * Find pickings by location ID
     */
    List<Picking> findByLocationId(UUID locationId);
    
    /**
     * Find pickings by location code
     */
    List<Picking> findByLocationCodeIgnoreCase(String locationCode);
    
    /**
     * Find pickings by item ID
     */
    List<Picking> findByItemId(UUID itemId);
    
    /**
     * Find pickings by item code
     */
    List<Picking> findByItemCodeIgnoreCase(String itemCode);
    
    /**
     * Find pickings by batch ID
     */
    List<Picking> findByBatchId(UUID batchId);
    
    /**
     * Find pickings by batch code
     */
    List<Picking> findByBatchCodeIgnoreCase(String batchCode);
    
    /**
     * Find pickings by serial ID
     */
    List<Picking> findBySerialId(UUID serialId);
    
    /**
     * Find pickings by serial code
     */
    List<Picking> findBySerialCodeIgnoreCase(String serialCode);
    
    /**
     * Find pickings by shipment ID
     */
    List<Picking> findByShipmentId(UUID shipmentId);
    
    /**
     * Find pickings by shipment code
     */
    List<Picking> findByShipmentCodeIgnoreCase(String shipmentCode);
    
    /**
     * Find pickings by work order
     */
    List<Picking> findByWorkOrderIgnoreCase(String workOrder);
    
    /**
     * Find pickings by customer
     */
    List<Picking> findByCustomerIgnoreCase(String customer);
    
    /**
     * Find pickings by status
     */
    List<Picking> findByStatus(Picking.PickingStatus status);
    
    /**
     * Find pickings by priority
     */
    List<Picking> findByPriority(Picking.Priority priority);
    
    /**
     * Find pickings by type
     */
    List<Picking> findByPickingType(Picking.PickingType pickingType);
    
    /**
     * Find pickings by assigned to
     */
    List<Picking> findByAssignedToIgnoreCase(String assignedTo);
    
    /**
     * Find pickings by picked by
     */
    List<Picking> findByPickedByIgnoreCase(String pickedBy);
    
    /**
     * Find pickings by confirmed by
     */
    List<Picking> findByConfirmedByIgnoreCase(String confirmedBy);
    
    /**
     * Find pickings by warehouse and status
     */
    List<Picking> findByWarehouseIdAndStatus(UUID warehouseId, Picking.PickingStatus status);
    
    /**
     * Find pickings by item and status
     */
    List<Picking> findByItemIdAndStatus(UUID itemId, Picking.PickingStatus status);
    
    /**
     * Find pickings by shipment and status
     */
    List<Picking> findByShipmentIdAndStatus(UUID shipmentId, Picking.PickingStatus status);
    
    /**
     * Find pickings by work order and status
     */
    List<Picking> findByWorkOrderIgnoreCaseAndStatus(String workOrder, Picking.PickingStatus status);
    
    /**
     * Find pickings with quantity not fully picked
     */
    @Query("SELECT p FROM Picking p WHERE p.quantityPicked < p.quantityRequested")
    List<Picking> findPickingsWithUnpickedQuantity();
    
    /**
     * Find pickings with quantity not fully confirmed
     */
    @Query("SELECT p FROM Picking p WHERE p.quantityConfirmed < p.quantityPicked")
    List<Picking> findPickingsWithUnconfirmedQuantity();
    
    /**
     * Find pickings by multiple criteria
     */
    @Query("SELECT p FROM Picking p WHERE " +
           "(:warehouseId IS NULL OR p.warehouseId = :warehouseId) " +
           "AND (:locationId IS NULL OR p.locationId = :locationId) " +
           "AND (:itemId IS NULL OR p.itemId = :itemId) " +
           "AND (:batchId IS NULL OR p.batchId = :batchId) " +
           "AND (:serialId IS NULL OR p.serialId = :serialId) " +
           "AND (:shipmentId IS NULL OR p.shipmentId = :shipmentId) " +
           "AND (:workOrder IS NULL OR LOWER(p.workOrder) = LOWER(:workOrder)) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:priority IS NULL OR p.priority = :priority) " +
           "AND (:pickingType IS NULL OR p.pickingType = :pickingType) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(p.code) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.warehouseName) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.locationCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.itemCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.batchCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.serialCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.shipmentCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.customer) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<Picking> findByCriteria(@Param("warehouseId") UUID warehouseId,
                               @Param("locationId") UUID locationId,
                               @Param("itemId") UUID itemId,
                               @Param("batchId") UUID batchId,
                               @Param("serialId") UUID serialId,
                               @Param("shipmentId") UUID shipmentId,
                               @Param("workOrder") String workOrder,
                               @Param("status") Picking.PickingStatus status,
                               @Param("priority") Picking.Priority priority,
                               @Param("pickingType") Picking.PickingType pickingType,
                               @Param("searchText") String searchText);
}