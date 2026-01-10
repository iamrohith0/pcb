package com.pcbxpress.erp.modules.warehouse.packing.repository;

import com.pcbxpress.erp.modules.warehouse.packing.model.Packing;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Packing entities
 */
@Repository
public interface PackingRepository extends JpaRepository<Packing, UUID> {
    
    /**
     * Find packing by code (case insensitive)
     */
    Packing findByCodeIgnoreCase(String code);
    
    /**
     * Check if packing code exists (excluding current packing)
     */
    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
    
    /**
     * Find packings by warehouse ID
     */
    List<Packing> findByWarehouseId(UUID warehouseId);
    
    /**
     * Find packings by warehouse name
     */
    List<Packing> findByWarehouseNameIgnoreCase(String warehouseName);
    
    /**
     * Find packings by location ID
     */
    List<Packing> findByLocationId(UUID locationId);
    
    /**
     * Find packings by location code
     */
    List<Packing> findByLocationCodeIgnoreCase(String locationCode);
    
    /**
     * Find packings by item ID
     */
    List<Packing> findByItemId(UUID itemId);
    
    /**
     * Find packings by item code
     */
    List<Packing> findByItemCodeIgnoreCase(String itemCode);
    
    /**
     * Find packings by batch ID
     */
    List<Packing> findByBatchId(UUID batchId);
    
    /**
     * Find packings by batch code
     */
    List<Packing> findByBatchCodeIgnoreCase(String batchCode);
    
    /**
     * Find packings by serial ID
     */
    List<Packing> findBySerialId(UUID serialId);
    
    /**
     * Find packings by serial code
     */
    List<Packing> findBySerialCodeIgnoreCase(String serialCode);
    
    /**
     * Find packings by shipment ID
     */
    List<Packing> findByShipmentId(UUID shipmentId);
    
    /**
     * Find packings by shipment code
     */
    List<Packing> findByShipmentCodeIgnoreCase(String shipmentCode);
    
    /**
     * Find packings by work order
     */
    List<Packing> findByWorkOrderIgnoreCase(String workOrder);
    
    /**
     * Find packings by pick list ID
     */
    List<Packing> findByPickListId(UUID pickListId);
    
    /**
     * Find packings by pick list code
     */
    List<Packing> findByPickListCodeIgnoreCase(String pickListCode);
    
    /**
     * Find packings by customer
     */
    List<Packing> findByCustomerIgnoreCase(String customer);
    
    /**
     * Find packings by status
     */
    List<Packing> findByStatus(Packing.PackingStatus status);
    
    /**
     * Find packings by priority
     */
    List<Packing> findByPriority(Packing.Priority priority);
    
    /**
     * Find packings by type
     */
    List<Packing> findByPackingType(Packing.PackingType packingType);
    
    /**
     * Find packings by carton type
     */
    List<Packing> findByCartonTypeIgnoreCase(String cartonType);
    
    /**
     * Find packings by assigned to
     */
    List<Packing> findByAssignedToIgnoreCase(String assignedTo);
    
    /**
     * Find packings by packed by
     */
    List<Packing> findByPackedByIgnoreCase(String packedBy);
    
    /**
     * Find packings by confirmed by
     */
    List<Packing> findByConfirmedByIgnoreCase(String confirmedBy);
    
    /**
     * Find packings by warehouse and status
     */
    List<Packing> findByWarehouseIdAndStatus(UUID warehouseId, Packing.PackingStatus status);
    
    /**
     * Find packings by item and status
     */
    List<Packing> findByItemIdAndStatus(UUID itemId, Packing.PackingStatus status);
    
    /**
     * Find packings by shipment and status
     */
    List<Packing> findByShipmentIdAndStatus(UUID shipmentId, Packing.PackingStatus status);
    
    /**
     * Find packings by pick list and status
     */
    List<Packing> findByPickListIdAndStatus(UUID pickListId, Packing.PackingStatus status);
    
    /**
     * Find packings by work order and status
     */
    List<Packing> findByWorkOrderIgnoreCaseAndStatus(String workOrder, Packing.PackingStatus status);
    
    /**
     * Find packings with quantity not fully packed
     */
    @Query("SELECT p FROM Packing p WHERE p.quantityPacked < p.quantityToPack")
    List<Packing> findPackingsWithUnpackedQuantity();
    
    /**
     * Find packings with quantity not fully confirmed
     */
    @Query("SELECT p FROM Packing p WHERE p.quantityConfirmed < p.quantityPacked")
    List<Packing> findPackingsWithUnconfirmedQuantity();
    
    /**
     * Find packings by multiple criteria
     */
    @Query("SELECT p FROM Packing p WHERE " +
           "(:warehouseId IS NULL OR p.warehouseId = :warehouseId) " +
           "AND (:locationId IS NULL OR p.locationId = :locationId) " +
           "AND (:itemId IS NULL OR p.itemId = :itemId) " +
           "AND (:batchId IS NULL OR p.batchId = :batchId) " +
           "AND (:serialId IS NULL OR p.serialId = :serialId) " +
           "AND (:shipmentId IS NULL OR p.shipmentId = :shipmentId) " +
           "AND (:pickListId IS NULL OR p.pickListId = :pickListId) " +
           "AND (:workOrder IS NULL OR LOWER(p.workOrder) = LOWER(:workOrder)) " +
           "AND (:status IS NULL OR p.status = :status) " +
           "AND (:priority IS NULL OR p.priority = :priority) " +
           "AND (:packingType IS NULL OR p.packingType = :packingType) " +
           "AND (:cartonType IS NULL OR LOWER(p.cartonType) = LOWER(:cartonType)) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(p.code) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.warehouseName) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.locationCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.itemCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.batchCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.serialCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.shipmentCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.pickListCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.customer) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<Packing> findByCriteria(@Param("warehouseId") UUID warehouseId,
                               @Param("locationId") UUID locationId,
                               @Param("itemId") UUID itemId,
                               @Param("batchId") UUID batchId,
                               @Param("serialId") UUID serialId,
                               @Param("shipmentId") UUID shipmentId,
                               @Param("pickListId") UUID pickListId,
                               @Param("workOrder") String workOrder,
                               @Param("status") Packing.PackingStatus status,
                               @Param("priority") Packing.Priority priority,
                               @Param("packingType") Packing.PackingType packingType,
                               @Param("cartonType") String cartonType,
                               @Param("searchText") String searchText);
}