package com.pcbxpress.erp.modules.warehouse.locations.repository;

import com.pcbxpress.erp.modules.warehouse.locations.model.Location;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Location entities
 */
@Repository
public interface LocationRepository extends JpaRepository<Location, UUID> {
    
    /**
     * Find location by code (case insensitive)
     */
    Location findByCodeIgnoreCase(String code);
    
    /**
     * Find location by name (case insensitive)
     */
    Location findByNameIgnoreCase(String name);
    
    /**
     * Check if location code exists (excluding current location)
     */
    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
    
    /**
     * Find locations by warehouse ID
     */
    List<Location> findByWarehouseId(UUID warehouseId);
    
    /**
     * Find locations by warehouse name
     */
    List<Location> findByWarehouseNameIgnoreCase(String warehouseName);
    
    /**
     * Find locations by type
     */
    List<Location> findByLocationType(Location.LocationType locationType);
    
    /**
     * Find active locations
     */
    List<Location> findByIsActiveTrue();
    
    /**
     * Find locations by status
     */
    List<Location> findByStatus(Location.LocationStatus status);
    
    /**
     * Find locations by zone
     */
    List<Location> findByZoneIgnoreCase(String zone);
    
    /**
     * Find locations by aisle
     */
    List<Location> findByAisleIgnoreCase(String aisle);
    
    /**
     * Find locations by rack
     */
    List<Location> findByRackIgnoreCase(String rack);
    
    /**
     * Find locations by shelf
     */
    List<Location> findByShelfIgnoreCase(String shelf);
    
    /**
     * Find locations by bin
     */
    List<Location> findByBinIgnoreCase(String bin);
    
    /**
     * Find locations by warehouse and active status
     */
    List<Location> findByWarehouseIdAndIsActive(UUID warehouseId, boolean isActive);
    
    /**
     * Find locations by type and active status
     */
    List<Location> findByLocationTypeAndIsActive(Location.LocationType locationType, boolean isActive);
    
    /**
     * Find locations by zone and warehouse
     */
    List<Location> findByZoneIgnoreCaseAndWarehouseId(String zone, UUID warehouseId);
    
    /**
     * Find locations by aisle and warehouse
     */
    List<Location> findByAisleIgnoreCaseAndWarehouseId(String aisle, UUID warehouseId);
    
    /**
     * Find locations by rack and warehouse
     */
    List<Location> findByRackIgnoreCaseAndWarehouseId(String rack, UUID warehouseId);
    
    /**
     * Find locations by shelf and warehouse
     */
    List<Location> findByShelfIgnoreCaseAndWarehouseId(String shelf, UUID warehouseId);
    
    /**
     * Find locations by bin and warehouse
     */
    List<Location> findByBinIgnoreCaseAndWarehouseId(String bin, UUID warehouseId);
    
    /**
     * Find locations with capacity utilization above threshold
     */
    @Query("SELECT l FROM Location l WHERE l.maxCapacity > 0 AND (l.currentCapacity / l.maxCapacity) > :threshold")
    List<Location> findLocationsByCapacityUtilization(@Param("threshold") Double threshold);
    
    /**
     * Find locations with serialization support
     */
    List<Location> findBySupportsSerializationTrue();
    
    /**
     * Find locations with lot tracking support
     */
    List<Location> findBySupportsLotTrackingTrue();
    
    /**
     * Find quarantine locations
     */
    List<Location> findByIsQuarantineTrue();
    
    /**
     * Find locked locations
     */
    List<Location> findByIsLockedTrue();
    
    /**
     * Find bulk storage locations
     */
    List<Location> findByIsBulkStorageTrue();
    
    /**
     * Find locations by multiple criteria
     */
    @Query("SELECT l FROM Location l WHERE " +
           "(:warehouseId IS NULL OR l.warehouseId = :warehouseId) " +
           "AND (:locationType IS NULL OR l.locationType = :locationType) " +
           "AND (:isActive IS NULL OR l.isActive = :isActive) " +
           "AND (:status IS NULL OR l.status = :status) " +
           "AND (:zone IS NULL OR LOWER(l.zone) = LOWER(:zone)) " +
           "AND (:aisle IS NULL OR LOWER(l.aisle) = LOWER(:aisle)) " +
           "AND (:rack IS NULL OR LOWER(l.rack) = LOWER(:rack)) " +
           "AND (:shelf IS NULL OR LOWER(l.shelf) = LOWER(:shelf)) " +
           "AND (:bin IS NULL OR LOWER(l.bin) = LOWER(:bin)) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(l.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(l.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(l.code) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(l.warehouseName) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<Location> findByCriteria(@Param("warehouseId") UUID warehouseId,
                                @Param("locationType") Location.LocationType locationType,
                                @Param("isActive") Boolean isActive,
                                @Param("status") Location.LocationStatus status,
                                @Param("zone") String zone,
                                @Param("aisle") String aisle,
                                @Param("rack") String rack,
                                @Param("shelf") String shelf,
                                @Param("bin") String bin,
                                @Param("searchText") String searchText);
}