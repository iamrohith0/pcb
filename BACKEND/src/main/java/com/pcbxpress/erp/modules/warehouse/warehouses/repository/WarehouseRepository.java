package com.pcbxpress.erp.modules.warehouse.warehouses.repository;

import com.pcbxpress.erp.modules.warehouse.warehouses.model.Warehouse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Warehouse entities
 */
@Repository
public interface WarehouseRepository extends JpaRepository<Warehouse, UUID> {
    
    /**
     * Find warehouse by code (case insensitive)
     */
    Warehouse findByCodeIgnoreCase(String code);
    
    /**
     * Find warehouse by name (case insensitive)
     */
    Warehouse findByNameIgnoreCase(String name);
    
    /**
     * Check if warehouse code exists (excluding current warehouse)
     */
    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
    
    /**
     * Find warehouses by plant ID
     */
    List<Warehouse> findByPlantId(UUID plantId);
    
    /**
     * Find warehouses by plant name
     */
    List<Warehouse> findByPlantNameIgnoreCase(String plantName);
    
    /**
     * Find warehouses by type
     */
    List<Warehouse> findByWarehouseType(Warehouse.WarehouseType warehouseType);
    
    /**
     * Find active warehouses
     */
    List<Warehouse> findByIsActiveTrue();
    
    /**
     * Find default warehouse
     */
    Warehouse findByIsDefaultTrue();
    
    /**
     * Find warehouses by active status
     */
    List<Warehouse> findByIsActive(boolean isActive);
    
    /**
     * Find warehouses by city
     */
    List<Warehouse> findByCityIgnoreCase(String city);
    
    /**
     * Find warehouses by country
     */
    List<Warehouse> findByCountryIgnoreCase(String country);
    
    /**
     * Find warehouses by contact name
     */
    List<Warehouse> findByContactNameIgnoreCase(String contactName);
    
    /**
     * Find warehouses by warehouse type and active status
     */
    List<Warehouse> findByWarehouseTypeAndIsActive(Warehouse.WarehouseType warehouseType, boolean isActive);
    
    /**
     * Find warehouses by plant and active status
     */
    List<Warehouse> findByPlantIdAndIsActive(UUID plantId, boolean isActive);
    
    /**
     * Find warehouses by name containing text (case insensitive)
     */
    List<Warehouse> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find warehouses by description containing text (case insensitive)
     */
    List<Warehouse> findByDescriptionContainingIgnoreCase(String description);
    
    /**
     * Find warehouses with capacity utilization above threshold
     */
    @Query("SELECT w FROM Warehouse w WHERE w.totalCapacity > 0 AND (w.usedCapacity / w.totalCapacity) > :threshold")
    List<Warehouse> findWarehousesByCapacityUtilization(@Param("threshold") Double threshold);
    
    /**
     * Find warehouses with temperature control support
     */
    List<Warehouse> findBySupportsTemperatureControlTrue();
    
    /**
     * Find warehouses with serialization support
     */
    List<Warehouse> findBySupportsSerializationTrue();
    
    /**
     * Find warehouses with lot tracking support
     */
    List<Warehouse> findBySupportsLotTrackingTrue();
    
    /**
     * Find warehouses by multiple criteria
     */
    @Query("SELECT w FROM Warehouse w WHERE " +
           "(:plantId IS NULL OR w.plantId = :plantId) " +
           "AND (:warehouseType IS NULL OR w.warehouseType = :warehouseType) " +
           "AND (:isActive IS NULL OR w.isActive = :isActive) " +
           "AND (:isDefault IS NULL OR w.isDefault = :isDefault) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(w.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(w.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(w.code) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(w.city) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(w.country) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<Warehouse> findByCriteria(@Param("plantId") UUID plantId,
                                 @Param("warehouseType") Warehouse.WarehouseType warehouseType,
                                 @Param("isActive") Boolean isActive,
                                 @Param("isDefault") Boolean isDefault,
                                 @Param("searchText") String searchText);
}