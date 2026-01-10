package com.pcbxpress.erp.modules.logistics.shipments.repository;

import com.pcbxpress.erp.modules.logistics.shipments.model.Shipment;
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
 * Repository for Shipment entities
 */
@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, UUID> {
    
    // Basic queries
    List<Shipment> findByCodeIgnoreCase(String code);
    
    List<Shipment> findByStatus(Shipment.ShipmentStatus status);
    
    List<Shipment> findByPriority(Shipment.Priority priority);
    
    List<Shipment> findByShipmentType(Shipment.ShipmentType shipmentType);
    
    List<Shipment> findByServiceLevel(Shipment.ServiceLevel serviceLevel);
    
    List<Shipment> findByOrderId(UUID orderId);
    
    List<Shipment> findByCustomerId(UUID customerId);
    
    List<Shipment> findByWarehouseId(UUID warehouseId);
    
    List<Shipment> findByCarrierId(UUID carrierId);
    
    List<Shipment> findByTrackingNumber(String trackingNumber);
    
    // Date range queries
    List<Shipment> findByShipmentDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<Shipment> findByEstimatedDeliveryBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<Shipment> findByActualDeliveryBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    // Custom queries with criteria
    @Query("SELECT s FROM Shipment s WHERE " +
           "(:orderId IS NULL OR s.orderId = :orderId) AND " +
           "(:customerId IS NULL OR s.customerId = :customerId) AND " +
           "(:warehouseId IS NULL OR s.warehouseId = :warehouseId) AND " +
           "(:carrierId IS NULL OR s.carrierId = :carrierId) AND " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:priority IS NULL OR s.priority = :priority) AND " +
           "(:shipmentType IS NULL OR s.shipmentType = :shipmentType) AND " +
           "(:serviceLevel IS NULL OR s.serviceLevel = :serviceLevel) AND " +
           "(:query IS NULL OR LOWER(s.code) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(s.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(s.trackingNumber) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(s.customerName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(s.carrierName) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Shipment> findByCriteria(
        @Param("orderId") UUID orderId,
        @Param("customerId") UUID customerId,
        @Param("warehouseId") UUID warehouseId,
        @Param("carrierId") UUID carrierId,
        @Param("status") Shipment.ShipmentStatus status,
        @Param("priority") Shipment.Priority priority,
        @Param("shipmentType") Shipment.ShipmentType shipmentType,
        @Param("serviceLevel") Shipment.ServiceLevel serviceLevel,
        @Param("query") String query
    );
    
    // Find shipments by date range
    @Query("SELECT s FROM Shipment s WHERE s.shipmentDate >= :startDate AND s.shipmentDate <= :endDate")
    List<Shipment> findShipmentsByShipmentDateRange(@Param("startDate") OffsetDateTime startDate, 
                                                    @Param("endDate") OffsetDateTime endDate);
    
    // Find shipments by estimated delivery range
    @Query("SELECT s FROM Shipment s WHERE s.estimatedDelivery >= :startDate AND s.estimatedDelivery <= :endDate")
    List<Shipment> findShipmentsByEstimatedDeliveryRange(@Param("startDate") OffsetDateTime startDate, 
                                                         @Param("endDate") OffsetDateTime endDate);
    
    // Find shipments by actual delivery range
    @Query("SELECT s FROM Shipment s WHERE s.actualDelivery >= :startDate AND s.actualDelivery <= :endDate")
    List<Shipment> findShipmentsByActualDeliveryRange(@Param("startDate") OffsetDateTime startDate, 
                                                      @Param("endDate") OffsetDateTime endDate);
    
    // Find shipments by customer name
    List<Shipment> findByCustomerNameIgnoreCaseContaining(String customerName);
    
    // Find shipments by carrier name
    List<Shipment> findByCarrierNameIgnoreCaseContaining(String carrierName);
    
    // Find shipments by tracking number
    List<Shipment> findByTrackingNumberIgnoreCaseContaining(String trackingNumber);
    
    // Find shipments by order code
    List<Shipment> findByOrderCodeIgnoreCaseContaining(String orderCode);
    
    // Find shipments by package count range
    @Query("SELECT s FROM Shipment s WHERE s.packageCount >= :minPackages AND s.packageCount <= :maxPackages")
    List<Shipment> findByPackageCountRange(@Param("minPackages") Integer minPackages, @Param("maxPackages") Integer maxPackages);
    
    // Find shipments by item count range
    @Query("SELECT s FROM Shipment s WHERE s.itemCount >= :minItems AND s.itemCount <= :maxItems")
    List<Shipment> findByItemCountRange(@Param("minItems") Integer minItems, @Param("maxItems") Integer maxItems);
    
    // Find shipments by weight range
    @Query("SELECT s FROM Shipment s WHERE s.weight >= :minWeight AND s.weight <= :maxWeight")
    List<Shipment> findByWeightRange(@Param("minWeight") Double minWeight, @Param("maxWeight") Double maxWeight);
    
    // Find shipments by value range
    @Query("SELECT s FROM Shipment s WHERE s.value >= :minValue AND s.value <= :maxValue")
    List<Shipment> findByValueRange(@Param("minValue") Double minValue, @Param("maxValue") Double maxValue);
    
    // Find shipments by declared value range
    @Query("SELECT s FROM Shipment s WHERE s.declaredValue >= :minDeclaredValue AND s.declaredValue <= :maxDeclaredValue")
    List<Shipment> findByDeclaredValueRange(@Param("minDeclaredValue") Double minDeclaredValue, @Param("maxDeclaredValue") Double maxDeclaredValue);
    
    // Find shipments by insurance value range
    @Query("SELECT s FROM Shipment s WHERE s.insuranceValue >= :minInsuranceValue AND s.insuranceValue <= :maxInsuranceValue")
    List<Shipment> findByInsuranceValueRange(@Param("minInsuranceValue") Double minInsuranceValue, @Param("maxInsuranceValue") Double maxInsuranceValue);
    
    // Find shipments by total charge range
    @Query("SELECT s FROM Shipment s WHERE s.totalCharge >= :minTotalCharge AND s.totalCharge <= :maxTotalCharge")
    List<Shipment> findByTotalChargeRange(@Param("minTotalCharge") Double minTotalCharge, @Param("maxTotalCharge") Double maxTotalCharge);
    
    // Find shipments by currency
    List<Shipment> findByCurrencyIgnoreCase(String currency);
    
    // Find shipments by shipped by user
    List<Shipment> findByShippedByIgnoreCaseContaining(String shippedBy);
    
    // Find shipments by received by user
    List<Shipment> findByReceivedByIgnoreCaseContaining(String receivedBy);
    
    // Find shipments by notes containing text
    List<Shipment> findByNotesIgnoreCaseContaining(String notes);
    
    // Find shipments by dimensions
    @Query("SELECT s FROM Shipment s WHERE s.dimensionsLength >= :minLength AND s.dimensionsLength <= :maxLength " +
           "AND s.dimensionsWidth >= :minWidth AND s.dimensionsWidth <= :maxWidth " +
           "AND s.dimensionsHeight >= :minHeight AND s.dimensionsHeight <= :maxHeight")
    List<Shipment> findByDimensionsRange(@Param("minLength") Double minLength, @Param("maxLength") Double maxLength,
                                         @Param("minWidth") Double minWidth, @Param("maxWidth") Double maxWidth,
                                         @Param("minHeight") Double minHeight, @Param("maxHeight") Double maxHeight);
    
    // Find shipments by weight unit
    List<Shipment> findByWeightUnitIgnoreCase(String weightUnit);
    
    // Find shipments by dimensions unit
    List<Shipment> findByDimensionsUnitIgnoreCase(String dimensionsUnit);
    
    // Find shipments by order code and status
    List<Shipment> findByOrderCodeIgnoreCaseAndStatus(String orderCode, Shipment.ShipmentStatus status);
    
    // Find shipments by tracking number and status
    List<Shipment> findByTrackingNumberIgnoreCaseAndStatus(String trackingNumber, Shipment.ShipmentStatus status);
    
    // Find shipments by customer name and status
    List<Shipment> findByCustomerNameIgnoreCaseAndStatus(String customerName, Shipment.ShipmentStatus status);
    
    // Find shipments by carrier name and status
    List<Shipment> findByCarrierNameIgnoreCaseAndStatus(String carrierName, Shipment.ShipmentStatus status);
    
    // Find shipments by shipped by and status
    List<Shipment> findByShippedByIgnoreCaseAndStatus(String shippedBy, Shipment.ShipmentStatus status);
    
    // Find shipments by received by and status
    List<Shipment> findByReceivedByIgnoreCaseAndStatus(String receivedBy, Shipment.ShipmentStatus status);
    
    // Find shipments by notes and status
    List<Shipment> findByNotesIgnoreCaseAndStatus(String notes, Shipment.ShipmentStatus status);
    
    // Find shipments by currency and status
    List<Shipment> findByCurrencyIgnoreCaseAndStatus(String currency, Shipment.ShipmentStatus status);
    
    // Find shipments by weight unit and status
    List<Shipment> findByWeightUnitIgnoreCaseAndStatus(String weightUnit, Shipment.ShipmentStatus status);
    
    // Find shipments by dimensions unit and status
    List<Shipment> findByDimensionsUnitIgnoreCaseAndStatus(String dimensionsUnit, Shipment.ShipmentStatus status);
    
    // Find shipments by package count range and status
    @Query("SELECT s FROM Shipment s WHERE s.packageCount >= :minPackages AND s.packageCount <= :maxPackages AND s.status = :status")
    List<Shipment> findByPackageCountRangeAndStatus(@Param("minPackages") Integer minPackages, @Param("maxPackages") Integer maxPackages,
                                                    @Param("status") Shipment.ShipmentStatus status);
    
    // Find shipments by item count range and status
    @Query("SELECT s FROM Shipment s WHERE s.itemCount >= :minItems AND s.itemCount <= :maxItems AND s.status = :status")
    List<Shipment> findByItemCountRangeAndStatus(@Param("minItems") Integer minItems, @Param("maxItems") Integer maxItems,
                                                 @Param("status") Shipment.ShipmentStatus status);
    
    // Find shipments by weight range and status
    @Query("SELECT s FROM Shipment s WHERE s.weight >= :minWeight AND s.weight <= :maxWeight AND s.status = :status")
    List<Shipment> findByWeightRangeAndStatus(@Param("minWeight") Double minWeight, @Param("maxWeight") Double maxWeight,
                                              @Param("status") Shipment.ShipmentStatus status);
    
    // Find shipments by value range and status
    @Query("SELECT s FROM Shipment s WHERE s.value >= :minValue AND s.value <= :maxValue AND s.status = :status")
    List<Shipment> findByValueRangeAndStatus(@Param("minValue") Double minValue, @Param("maxValue") Double maxValue,
                                             @Param("status") Shipment.ShipmentStatus status);
    
    // Find shipments by declared value range and status
    @Query("SELECT s FROM Shipment s WHERE s.declaredValue >= :minDeclaredValue AND s.declaredValue <= :maxDeclaredValue AND s.status = :status")
    List<Shipment> findByDeclaredValueRangeAndStatus(@Param("minDeclaredValue") Double minDeclaredValue, @Param("maxDeclaredValue") Double maxDeclaredValue,
                                                     @Param("status") Shipment.ShipmentStatus status);
    
    // Find shipments by insurance value range and status
    @Query("SELECT s FROM Shipment s WHERE s.insuranceValue >= :minInsuranceValue AND s.insuranceValue <= :maxInsuranceValue AND s.status = :status")
    List<Shipment> findByInsuranceValueRangeAndStatus(@Param("minInsuranceValue") Double minInsuranceValue, @Param("maxInsuranceValue") Double maxInsuranceValue,
                                                      @Param("status") Shipment.ShipmentStatus status);
    
    // Find shipments by total charge range and status
    @Query("SELECT s FROM Shipment s WHERE s.totalCharge >= :minTotalCharge AND s.totalCharge <= :maxTotalCharge AND s.status = :status")
    List<Shipment> findByTotalChargeRangeAndStatus(@Param("minTotalCharge") Double minTotalCharge, @Param("maxTotalCharge") Double maxTotalCharge,
                                                   @Param("status") Shipment.ShipmentStatus status);
    
    // Find shipments by dimensions range and status
    @Query("SELECT s FROM Shipment s WHERE s.dimensionsLength >= :minLength AND s.dimensionsLength <= :maxLength " +
           "AND s.dimensionsWidth >= :minWidth AND s.dimensionsWidth <= :maxWidth " +
           "AND s.dimensionsHeight >= :minHeight AND s.dimensionsHeight <= :maxHeight " +
           "AND s.status = :status")
    List<Shipment> findByDimensionsRangeAndStatus(@Param("minLength") Double minLength, @Param("maxLength") Double maxLength,
                                                  @Param("minWidth") Double minWidth, @Param("maxWidth") Double maxWidth,
                                                  @Param("minHeight") Double minHeight, @Param("maxHeight") Double maxHeight,
                                                  @Param("status") Shipment.ShipmentStatus status);
    
    // Find shipments by date range with pagination
    @Query("SELECT s FROM Shipment s WHERE s.shipmentDate >= :startDate AND s.shipmentDate <= :endDate")
    Page<Shipment> findShipmentsByShipmentDateRange(@Param("startDate") OffsetDateTime startDate, 
                                                    @Param("endDate") OffsetDateTime endDate,
                                                    Pageable pageable);
    
    // Find shipments by estimated delivery range with pagination
    @Query("SELECT s FROM Shipment s WHERE s.estimatedDelivery >= :startDate AND s.estimatedDelivery <= :endDate")
    Page<Shipment> findShipmentsByEstimatedDeliveryRange(@Param("startDate") OffsetDateTime startDate, 
                                                         @Param("endDate") OffsetDateTime endDate,
                                                         Pageable pageable);
    
    // Find shipments by actual delivery range with pagination
    @Query("SELECT s FROM Shipment s WHERE s.actualDelivery >= :startDate AND s.actualDelivery <= :endDate")
    Page<Shipment> findShipmentsByActualDeliveryRange(@Param("startDate") OffsetDateTime startDate, 
                                                      @Param("endDate") OffsetDateTime endDate,
                                                      Pageable pageable);
    
    // Find shipments by weight range with pagination
    @Query("SELECT s FROM Shipment s WHERE s.weight >= :minWeight AND s.weight <= :maxWeight")
    Page<Shipment> findShipmentsByWeightRange(@Param("minWeight") Double minWeight, @Param("maxWeight") Double maxWeight,
                                              Pageable pageable);
    
    // Find shipments by value range with pagination
    @Query("SELECT s FROM Shipment s WHERE s.value >= :minValue AND s.value <= :maxValue")
    Page<Shipment> findShipmentsByValueRange(@Param("minValue") Double minValue, @Param("maxValue") Double maxValue,
                                             Pageable pageable);
    
    // Find shipments by declared value range with pagination
    @Query("SELECT s FROM Shipment s WHERE s.declaredValue >= :minDeclaredValue AND s.declaredValue <= :maxDeclaredValue")
    Page<Shipment> findShipmentsByDeclaredValueRange(@Param("minDeclaredValue") Double minDeclaredValue, @Param("maxDeclaredValue") Double maxDeclaredValue,
                                                     Pageable pageable);
    
    // Find shipments by insurance value range with pagination
    @Query("SELECT s FROM Shipment s WHERE s.insuranceValue >= :minInsuranceValue AND s.insuranceValue <= :maxInsuranceValue")
    Page<Shipment> findShipmentsByInsuranceValueRange(@Param("minInsuranceValue") Double minInsuranceValue, @Param("maxInsuranceValue") Double maxInsuranceValue,
                                                      Pageable pageable);
    
    // Find shipments by total charge range with pagination
    @Query("SELECT s FROM Shipment s WHERE s.totalCharge >= :minTotalCharge AND s.totalCharge <= :maxTotalCharge")
    Page<Shipment> findShipmentsByTotalChargeRange(@Param("minTotalCharge") Double minTotalCharge, @Param("maxTotalCharge") Double maxTotalCharge,
                                                   Pageable pageable);
    
    // Find shipments by dimensions range with pagination
    @Query("SELECT s FROM Shipment s WHERE s.dimensionsLength >= :minLength AND s.dimensionsLength <= :maxLength " +
           "AND s.dimensionsWidth >= :minWidth AND s.dimensionsWidth <= :maxWidth " +
           "AND s.dimensionsHeight >= :minHeight AND s.dimensionsHeight <= :maxHeight")
    Page<Shipment> findShipmentsByDimensionsRange(@Param("minLength") Double minLength, @Param("maxLength") Double maxLength,
                                                  @Param("minWidth") Double minWidth, @Param("maxWidth") Double maxWidth,
                                                  @Param("minHeight") Double minHeight, @Param("maxHeight") Double maxHeight,
                                                  Pageable pageable);
    
    // Check if shipment code exists (excluding current shipment)
    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
    
    // Find shipments by status and priority
    List<Shipment> findByStatusAndPriority(Shipment.ShipmentStatus status, Shipment.Priority priority);
    
    // Find shipments by warehouse and status
    List<Shipment> findByWarehouseIdAndStatus(UUID warehouseId, Shipment.ShipmentStatus status);
    
    // Find shipments by carrier and status
    List<Shipment> findByCarrierIdAndStatus(UUID carrierId, Shipment.ShipmentStatus status);
    
    // Find shipments by customer and status
    List<Shipment> findByCustomerIdAndStatus(UUID customerId, Shipment.ShipmentStatus status);
    
    // Find shipments by shipment type and status
    List<Shipment> findByShipmentTypeAndStatus(Shipment.ShipmentType shipmentType, Shipment.ShipmentStatus status);
    
    // Find shipments by service level and status
    List<Shipment> findByServiceLevelAndStatus(Shipment.ServiceLevel serviceLevel, Shipment.ShipmentStatus status);
    
    // Find shipments by priority and status
    List<Shipment> findByPriorityAndStatus(Shipment.Priority priority, Shipment.ShipmentStatus status);
    
    // Find shipments by date range and status
    @Query("SELECT s FROM Shipment s WHERE s.shipmentDate >= :startDate AND s.shipmentDate <= :endDate AND s.status = :status")
    List<Shipment> findByShipmentDateRangeAndStatus(@Param("startDate") OffsetDateTime startDate, 
                                                    @Param("endDate") OffsetDateTime endDate,
                                                    @Param("status") Shipment.ShipmentStatus status);
    
    // Find shipments by estimated delivery range and status
    @Query("SELECT s FROM Shipment s WHERE s.estimatedDelivery >= :startDate AND s.estimatedDelivery <= :endDate AND s.status = :status")
    List<Shipment> findByEstimatedDeliveryRangeAndStatus(@Param("startDate") OffsetDateTime startDate, 
                                                         @Param("endDate") OffsetDateTime endDate,
                                                         @Param("status") Shipment.ShipmentStatus status);
    
    // Find shipments by actual delivery range and status
    @Query("SELECT s FROM Shipment s WHERE s.actualDelivery >= :startDate AND s.actualDelivery <= :endDate AND s.status = :status")
    List<Shipment> findByActualDeliveryRangeAndStatus(@Param("startDate") OffsetDateTime startDate, 
                                                      @Param("endDate") OffsetDateTime endDate,
                                                      @Param("status") Shipment.ShipmentStatus status);
}