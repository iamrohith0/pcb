package com.pcbxpress.erp.modules.logistics.tracking.repository;

import com.pcbxpress.erp.modules.logistics.tracking.model.Tracking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for Tracking entities
 */
@Repository
public interface TrackingRepository extends JpaRepository<Tracking, UUID> {
    
    // Basic queries
    List<Tracking> findByTrackingId(String trackingId);
    
    List<Tracking> findByStatus(Tracking.TrackingStatus status);
    
    List<Tracking> findByTrackingType(Tracking.TrackingType trackingType);
    
    List<Tracking> findByShipmentId(UUID shipmentId);
    
    List<Tracking> findByShipmentCode(String shipmentCode);
    
    List<Tracking> findByPackageId(UUID packageId);
    
    List<Tracking> findByPackageCode(String packageCode);
    
    List<Tracking> findByCarrierId(UUID carrierId);
    
    List<Tracking> findByCarrierName(String carrierName);
    
    List<Tracking> findByIsActive(Boolean isActive);
    
    // Date range queries
    List<Tracking> findByEventTimeBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<Tracking> findByEstimatedDeliveryBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<Tracking> findByActualDeliveryBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<Tracking> findByLastUpdatedBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    // Custom queries with criteria
    @Query("SELECT t FROM Tracking t WHERE " +
           "(:shipmentId IS NULL OR t.shipmentId = :shipmentId) AND " +
           "(:packageId IS NULL OR t.packageId = :packageId) AND " +
           "(:carrierId IS NULL OR t.carrierId = :carrierId) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:trackingType IS NULL OR t.trackingType = :trackingType) AND " +
           "(:isActive IS NULL OR t.isActive = :isActive) AND " +
           "(:query IS NULL OR LOWER(t.trackingId) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(t.carrierName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(t.locationName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(t.locationCity) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(t.locationCountry) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Tracking> findByCriteria(
        @Param("shipmentId") UUID shipmentId,
        @Param("packageId") UUID packageId,
        @Param("carrierId") UUID carrierId,
        @Param("status") Tracking.TrackingStatus status,
        @Param("trackingType") Tracking.TrackingType trackingType,
        @Param("isActive") Boolean isActive,
        @Param("query") String query
    );
    
    // Find tracking by location
    List<Tracking> findByLocationNameIgnoreCaseContaining(String locationName);
    
    List<Tracking> findByLocationCityIgnoreCaseContaining(String locationCity);
    
    List<Tracking> findByLocationStateIgnoreCaseContaining(String locationState);
    
    List<Tracking> findByLocationCountryIgnoreCaseContaining(String locationCountry);
    
    List<Tracking> findByLocationPostalCodeIgnoreCaseContaining(String locationPostalCode);
    
    // Find tracking by delivery contact
    List<Tracking> findByDeliveryContactNameIgnoreCaseContaining(String deliveryContactName);
    
    List<Tracking> findByDeliveryContactPhoneIgnoreCaseContaining(String deliveryContactPhone);
    
    List<Tracking> findByDeliveryContactEmailIgnoreCaseContaining(String deliveryContactEmail);
    
    // Find tracking by status and type
    List<Tracking> findByStatusAndTrackingType(Tracking.TrackingStatus status, Tracking.TrackingType trackingType);
    
    // Find tracking by shipment and status
    List<Tracking> findByShipmentIdAndStatus(UUID shipmentId, Tracking.TrackingStatus status);
    
    // Find tracking by package and status
    List<Tracking> findByPackageIdAndStatus(UUID packageId, Tracking.TrackingStatus status);
    
    // Find tracking by carrier and status
    List<Tracking> findByCarrierIdAndStatus(UUID carrierId, Tracking.TrackingStatus status);
    
    // Find tracking by active status
    List<Tracking> findByIsActiveTrue();
    
    List<Tracking> findByIsActiveFalse();
    
    // Find tracking by date range
    @Query("SELECT t FROM Tracking t WHERE t.eventTime >= :startDate AND t.eventTime <= :endDate")
    List<Tracking> findTrackingByEventTimeRange(@Param("startDate") OffsetDateTime startDate, 
                                                @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT t FROM Tracking t WHERE t.estimatedDelivery >= :startDate AND t.estimatedDelivery <= :endDate")
    List<Tracking> findTrackingByEstimatedDeliveryRange(@Param("startDate") OffsetDateTime startDate, 
                                                        @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT t FROM Tracking t WHERE t.actualDelivery >= :startDate AND t.actualDelivery <= :endDate")
    List<Tracking> findTrackingByActualDeliveryRange(@Param("startDate") OffsetDateTime startDate, 
                                                     @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT t FROM Tracking t WHERE t.lastUpdated >= :startDate AND t.lastUpdated <= :endDate")
    List<Tracking> findTrackingByLastUpdatedRange(@Param("startDate") OffsetDateTime startDate, 
                                                  @Param("endDate") OffsetDateTime endDate);
    
    // Find tracking by coordinates
    @Query("SELECT t FROM Tracking t WHERE t.latitude >= :minLat AND t.latitude <= :maxLat " +
           "AND t.longitude >= :minLon AND t.longitude <= :maxLon")
    List<Tracking> findTrackingByCoordinates(@Param("minLat") Double minLat, @Param("maxLat") Double maxLat,
                                             @Param("minLon") Double minLon, @Param("maxLon") Double maxLon);
    
    // Find tracking by delivery attempt count
    @Query("SELECT t FROM Tracking t WHERE t.deliveryAttemptCount >= :minAttempts AND t.deliveryAttemptCount <= :maxAttempts")
    List<Tracking> findTrackingByDeliveryAttemptCount(@Param("minAttempts") Integer minAttempts, @Param("maxAttempts") Integer maxAttempts);
    
    // Find tracking by status description
    List<Tracking> findByStatusDescriptionIgnoreCaseContaining(String statusDescription);
    
    // Find tracking by status code
    List<Tracking> findByStatusCodeIgnoreCaseContaining(String statusCode);
    
    // Find tracking by notes
    List<Tracking> findByNotesIgnoreCaseContaining(String notes);
    
    // Find tracking by carrier tracking URL
    List<Tracking> findByCarrierTrackingUrlIgnoreCaseContaining(String carrierTrackingUrl);
    
    // Find tracking by delivery notes
    List<Tracking> findByDeliveryNotesIgnoreCaseContaining(String deliveryNotes);
    
    // Find tracking by delivery signature
    List<Tracking> findByDeliverySignatureIgnoreCaseContaining(String deliverySignature);
    
    // Find tracking by location address
    List<Tracking> findByLocationAddressIgnoreCaseContaining(String locationAddress);
    
    // Find tracking by shipment code and status
    List<Tracking> findByShipmentCodeIgnoreCaseAndStatus(String shipmentCode, Tracking.TrackingStatus status);
    
    // Find tracking by package code and status
    List<Tracking> findByPackageCodeIgnoreCaseAndStatus(String packageCode, Tracking.TrackingStatus status);
    
    // Find tracking by carrier name and status
    List<Tracking> findByCarrierNameIgnoreCaseAndStatus(String carrierName, Tracking.TrackingStatus status);
    
    // Find tracking by location name and status
    List<Tracking> findByLocationNameIgnoreCaseAndStatus(String locationName, Tracking.TrackingStatus status);
    
    // Find tracking by location city and status
    List<Tracking> findByLocationCityIgnoreCaseAndStatus(String locationCity, Tracking.TrackingStatus status);
    
    // Find tracking by location country and status
    List<Tracking> findByLocationCountryIgnoreCaseAndStatus(String locationCountry, Tracking.TrackingStatus status);
    
    // Find tracking by delivery contact name and status
    List<Tracking> findByDeliveryContactNameIgnoreCaseAndStatus(String deliveryContactName, Tracking.TrackingStatus status);
    
    // Find tracking by delivery contact email and status
    List<Tracking> findByDeliveryContactEmailIgnoreCaseAndStatus(String deliveryContactEmail, Tracking.TrackingStatus status);
    
    // Find tracking by status and active
    List<Tracking> findByStatusAndIsActive(Tracking.TrackingStatus status, Boolean isActive);
    
    // Find tracking by tracking type and active
    List<Tracking> findByTrackingTypeAndIsActive(Tracking.TrackingType trackingType, Boolean isActive);
    
    // Find tracking by date range and status
    @Query("SELECT t FROM Tracking t WHERE t.eventTime >= :startDate AND t.eventTime <= :endDate AND t.status = :status")
    List<Tracking> findByEventTimeRangeAndStatus(@Param("startDate") OffsetDateTime startDate, 
                                                 @Param("endDate") OffsetDateTime endDate,
                                                 @Param("status") Tracking.TrackingStatus status);
    
    // Find tracking by estimated delivery range and status
    @Query("SELECT t FROM Tracking t WHERE t.estimatedDelivery >= :startDate AND t.estimatedDelivery <= :endDate AND t.status = :status")
    List<Tracking> findByEstimatedDeliveryRangeAndStatus(@Param("startDate") OffsetDateTime startDate, 
                                                         @Param("endDate") OffsetDateTime endDate,
                                                         @Param("status") Tracking.TrackingStatus status);
    
    // Find tracking by actual delivery range and status
    @Query("SELECT t FROM Tracking t WHERE t.actualDelivery >= :startDate AND t.actualDelivery <= :endDate AND t.status = :status")
    List<Tracking> findByActualDeliveryRangeAndStatus(@Param("startDate") OffsetDateTime startDate, 
                                                      @Param("endDate") OffsetDateTime endDate,
                                                      @Param("status") Tracking.TrackingStatus status);
    
    // Find tracking by last updated range and status
    @Query("SELECT t FROM Tracking t WHERE t.lastUpdated >= :startDate AND t.lastUpdated <= :endDate AND t.status = :status")
    List<Tracking> findByLastUpdatedRangeAndStatus(@Param("startDate") OffsetDateTime startDate, 
                                                   @Param("endDate") OffsetDateTime endDate,
                                                   @Param("status") Tracking.TrackingStatus status);
    
    // Find tracking by coordinates and status
    @Query("SELECT t FROM Tracking t WHERE t.latitude >= :minLat AND t.latitude <= :maxLat " +
           "AND t.longitude >= :minLon AND t.longitude <= :maxLon AND t.status = :status")
    List<Tracking> findByCoordinatesAndStatus(@Param("minLat") Double minLat, @Param("maxLat") Double maxLat,
                                              @Param("minLon") Double minLon, @Param("maxLon") Double maxLon,
                                              @Param("status") Tracking.TrackingStatus status);
    
    // Find tracking by delivery attempt count and status
    @Query("SELECT t FROM Tracking t WHERE t.deliveryAttemptCount >= :minAttempts AND t.deliveryAttemptCount <= :maxAttempts AND t.status = :status")
    List<Tracking> findByDeliveryAttemptCountAndStatus(@Param("minAttempts") Integer minAttempts, @Param("maxAttempts") Integer maxAttempts,
                                                       @Param("status") Tracking.TrackingStatus status);
    
    // Find tracking by date range with pagination
    @Query("SELECT t FROM Tracking t WHERE t.eventTime >= :startDate AND t.eventTime <= :endDate")
    Page<Tracking> findTrackingByEventTimeRange(@Param("startDate") OffsetDateTime startDate, 
                                                @Param("endDate") OffsetDateTime endDate,
                                                Pageable pageable);
    
    @Query("SELECT t FROM Tracking t WHERE t.estimatedDelivery >= :startDate AND t.estimatedDelivery <= :endDate")
    Page<Tracking> findTrackingByEstimatedDeliveryRange(@Param("startDate") OffsetDateTime startDate, 
                                                        @Param("endDate") OffsetDateTime endDate,
                                                        Pageable pageable);
    
    @Query("SELECT t FROM Tracking t WHERE t.actualDelivery >= :startDate AND t.actualDelivery <= :endDate")
    Page<Tracking> findTrackingByActualDeliveryRange(@Param("startDate") OffsetDateTime startDate, 
                                                     @Param("endDate") OffsetDateTime endDate,
                                                     Pageable pageable);
    
    @Query("SELECT t FROM Tracking t WHERE t.lastUpdated >= :startDate AND t.lastUpdated <= :endDate")
    Page<Tracking> findTrackingByLastUpdatedRange(@Param("startDate") OffsetDateTime startDate, 
                                                  @Param("endDate") OffsetDateTime endDate,
                                                  Pageable pageable);
    
    // Find tracking by coordinates with pagination
    @Query("SELECT t FROM Tracking t WHERE t.latitude >= :minLat AND t.latitude <= :maxLat " +
           "AND t.longitude >= :minLon AND t.longitude <= :maxLon")
    Page<Tracking> findTrackingByCoordinates(@Param("minLat") Double minLat, @Param("maxLat") Double maxLat,
                                             @Param("minLon") Double minLon, @Param("maxLon") Double maxLon,
                                             Pageable pageable);
    
    // Find tracking by delivery attempt count with pagination
    @Query("SELECT t FROM Tracking t WHERE t.deliveryAttemptCount >= :minAttempts AND t.deliveryAttemptCount <= :maxAttempts")
    Page<Tracking> findTrackingByDeliveryAttemptCount(@Param("minAttempts") Integer minAttempts, @Param("maxAttempts") Integer maxAttempts,
                                                      Pageable pageable);
    
    // Check if tracking ID exists (excluding current tracking)
    boolean existsByTrackingIdIgnoreCaseAndIdNot(String trackingId, UUID id);
    
    // Find latest tracking for a shipment
    @Query("SELECT t FROM Tracking t WHERE t.shipmentId = :shipmentId ORDER BY t.eventTime DESC")
    List<Tracking> findLatestTrackingByShipmentId(@Param("shipmentId") UUID shipmentId);
    
    // Find latest tracking for a package
    @Query("SELECT t FROM Tracking t WHERE t.packageId = :packageId ORDER BY t.eventTime DESC")
    List<Tracking> findLatestTrackingByPackageId(@Param("packageId") UUID packageId);
    
    // Find latest tracking for a tracking ID
    @Query("SELECT t FROM Tracking t WHERE t.trackingId = :trackingId ORDER BY t.eventTime DESC")
    List<Tracking> findLatestTrackingByTrackingId(@Param("trackingId") String trackingId);
}