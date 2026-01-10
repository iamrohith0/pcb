package com.pcbxpress.erp.modules.inventory.serials.repository;

import com.pcbxpress.erp.modules.inventory.serials.model.Serial;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Serial Management
 */
@Repository
public interface SerialRepository extends JpaRepository<Serial, UUID> {
    
    /**
     * Find serial by serial number
     */
    Serial findBySerialNumber(String serialNumber);
    
    /**
     * Find serials by item ID
     */
    List<Serial> findByItemId(UUID itemId);
    
    /**
     * Find serials by lot ID
     */
    List<Serial> findByLotId(UUID lotId);
    
    /**
     * Find serials by work order ID
     */
    List<Serial> findByWorkOrderId(UUID workOrderId);
    
    /**
     * Find serials by status
     */
    List<Serial> findByStatus(Serial.SerialStatus status);
    
    /**
     * Find serials by quality status
     */
    List<Serial> findByQualityStatus(Serial.QualityStatus qualityStatus);
    
    /**
     * Find serials by parent serial ID
     */
    List<Serial> findByParentSerialId(UUID parentSerialId);
    
    /**
     * Find serials by current warehouse ID
     */
    List<Serial> findByCurrentWarehouseId(UUID currentWarehouseId);
    
    /**
     * Find serials by current work order ID
     */
    List<Serial> findByCurrentWorkOrderId(UUID currentWorkOrderId);
    
    /**
     * Find serials by current location
     */
    List<Serial> findByCurrentLocation(String currentLocation);
    
    /**
     * Find serials expiring within days
     */
    @Query("SELECT s FROM Serial s WHERE s.expirationDate IS NOT NULL AND s.expirationDate <= :expirationDate")
    List<Serial> findExpiringSerials(@Param("expirationDate") OffsetDateTime expirationDate);
    
    /**
     * Find serials with warranty expiring within days
     */
    @Query("SELECT s FROM Serial s WHERE s.warrantyExpiryDate IS NOT NULL AND s.warrantyExpiryDate <= :warrantyExpiryDate")
    List<Serial> findWarrantyExpiringSerials(@Param("warrantyExpiryDate") OffsetDateTime warrantyExpiryDate);
    
    /**
     * Find serials by item and status
     */
    List<Serial> findByItemIdAndStatus(UUID itemId, Serial.SerialStatus status);
    
    /**
     * Find serials by item and quality status
     */
    List<Serial> findByItemIdAndQualityStatus(UUID itemId, Serial.QualityStatus qualityStatus);
    
    /**
     * Find serials received within date range
     */
    @Query("SELECT s FROM Serial s WHERE s.receivedDate >= :fromDate AND s.receivedDate <= :toDate")
    List<Serial> findSerialsByReceivedDateRange(@Param("fromDate") OffsetDateTime fromDate,
                                              @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Find serials manufactured within date range
     */
    @Query("SELECT s FROM Serial s WHERE s.manufactureDate >= :fromDate AND s.manufactureDate <= :toDate")
    List<Serial> findSerialsByManufactureDateRange(@Param("fromDate") OffsetDateTime fromDate,
                                                 @Param("toDate") OffsetDateTime toDate);
    
    /**
     * Find serials with genealogy relationships
     */
    @Query("SELECT s FROM Serial s WHERE s.parentSerialId IS NOT NULL OR s.childSerialIds IS NOT NULL")
    List<Serial> findSerialsWithGenealogy();
    
    /**
     * Find serials in quarantine
     */
    @Query("SELECT s FROM Serial s WHERE s.status = :status OR s.qualityStatus = :qualityStatus")
    List<Serial> findQuarantineSerials(@Param("status") Serial.SerialStatus status,
                                     @Param("qualityStatus") Serial.QualityStatus qualityStatus);
    
    /**
     * Find available serials for assignment
     */
    @Query("SELECT s FROM Serial s WHERE s.status = :status AND s.currentWorkOrderId IS NULL")
    List<Serial> findAvailableSerials(@Param("status") Serial.SerialStatus status);
}