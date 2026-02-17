package com.pcbxpress.erp.modules.logistics.dispatch.repository;

import com.pcbxpress.erp.modules.logistics.dispatch.model.Dispatch;
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
 * Repository for Dispatch entities
 */
@Repository
public interface DispatchRepository extends JpaRepository<Dispatch, UUID> {

       // Basic queries
       List<Dispatch> findByCodeIgnoreCase(String code);

       List<Dispatch> findByStatus(Dispatch.DispatchStatus status);

       List<Dispatch> findByPriority(Dispatch.Priority priority);

       List<Dispatch> findByDispatchType(Dispatch.DispatchType dispatchType);

       List<Dispatch> findByOrderId(UUID orderId);

       List<Dispatch> findByCustomerId(UUID customerId);

       List<Dispatch> findByWarehouseId(UUID warehouseId);

       List<Dispatch> findByCarrierId(UUID carrierId);

       List<Dispatch> findByShipmentId(UUID shipmentId);

       List<Dispatch> findByTrackingNumber(String trackingNumber);

       // Date range queries
       List<Dispatch> findByDispatchDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);

       List<Dispatch> findByEstimatedDeliveryBetween(OffsetDateTime startDate, OffsetDateTime endDate);

       List<Dispatch> findByActualDeliveryBetween(OffsetDateTime startDate, OffsetDateTime endDate);

       // Custom queries with criteria
       // Uses native SQL to avoid Hibernate 6 / PostgreSQL type-inference issues
       // with null UUID parameters. JPQL CAST(:uuid AS text) gets translated to
       // cast(? as varchar) which fails when Hibernate binds null UUIDs as bytea.
       @Query(value = "SELECT d.* FROM dispatches d WHERE " +
                     "(:orderId IS NULL OR d.order_id = CAST(:orderId AS uuid)) AND " +
                     "(:customerId IS NULL OR d.customer_id = CAST(:customerId AS uuid)) AND " +
                     "(:warehouseId IS NULL OR d.warehouse_id = CAST(:warehouseId AS uuid)) AND " +
                     "(:carrierId IS NULL OR d.carrier_id = CAST(:carrierId AS uuid)) AND " +
                     "(CAST(:status AS VARCHAR) IS NULL OR d.status = CAST(:status AS VARCHAR)) AND " +
                     "(CAST(:priority AS VARCHAR) IS NULL OR d.priority = CAST(:priority AS VARCHAR)) AND " +
                     "(CAST(:dispatchType AS VARCHAR) IS NULL OR d.dispatch_type = CAST(:dispatchType AS VARCHAR)) AND "
                     +
                     "(:query IS NULL OR :query = '' " +
                     " OR LOWER(d.code) LIKE LOWER(CONCAT('%', :query, '%')) " +
                     " OR LOWER(d.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
                     " OR LOWER(d.tracking_number) LIKE LOWER(CONCAT('%', :query, '%')) " +
                     " OR LOWER(d.customer_name) LIKE LOWER(CONCAT('%', :query, '%')) " +
                     " OR LOWER(d.carrier_name) LIKE LOWER(CONCAT('%', :query, '%'))) " +
                     "ORDER BY d.updated_at DESC", nativeQuery = true)
       List<Dispatch> findByCriteria(
                     @Param("orderId") UUID orderId,
                     @Param("customerId") UUID customerId,
                     @Param("warehouseId") UUID warehouseId,
                     @Param("carrierId") UUID carrierId,
                     @Param("status") String status,
                     @Param("priority") String priority,
                     @Param("dispatchType") String dispatchType,
                     @Param("query") String query);

       // Find dispatches with unpicked quantity (for integration with picking)
       @Query("SELECT d FROM Dispatch d WHERE d.status IN :statuses")
       List<Dispatch> findDispatchesByStatuses(List<Dispatch.DispatchStatus> statuses);

       // Find dispatches by date range
       @Query("SELECT d FROM Dispatch d WHERE d.dispatchDate >= :startDate AND d.dispatchDate <= :endDate")
       List<Dispatch> findDispatchesByDispatchDateRange(@Param("startDate") OffsetDateTime startDate,
                     @Param("endDate") OffsetDateTime endDate);

       // Find dispatches by estimated delivery range
       @Query("SELECT d FROM Dispatch d WHERE d.estimatedDelivery >= :startDate AND d.estimatedDelivery <= :endDate")
       List<Dispatch> findDispatchesByEstimatedDeliveryRange(@Param("startDate") OffsetDateTime startDate,
                     @Param("endDate") OffsetDateTime endDate);

       // Find dispatches by actual delivery range
       @Query("SELECT d FROM Dispatch d WHERE d.actualDelivery >= :startDate AND d.actualDelivery <= :endDate")
       List<Dispatch> findDispatchesByActualDeliveryRange(@Param("startDate") OffsetDateTime startDate,
                     @Param("endDate") OffsetDateTime endDate);

       // Find dispatches by customer name
       List<Dispatch> findByCustomerNameIgnoreCaseContaining(String customerName);

       // Find dispatches by carrier name
       List<Dispatch> findByCarrierNameIgnoreCaseContaining(String carrierName);

       // Find dispatches by tracking number
       List<Dispatch> findByTrackingNumberIgnoreCaseContaining(String trackingNumber);

       // Find dispatches by order code
       List<Dispatch> findByOrderCodeIgnoreCaseContaining(String orderCode);

       // Find dispatches by shipment code
       List<Dispatch> findByShipmentCodeIgnoreCaseContaining(String shipmentCode);

       // Check if dispatch code exists (excluding current dispatch)
       boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);

       // Find dispatches by status and priority
       List<Dispatch> findByStatusAndPriority(Dispatch.DispatchStatus status, Dispatch.Priority priority);

       // Find dispatches by warehouse and status
       List<Dispatch> findByWarehouseIdAndStatus(UUID warehouseId, Dispatch.DispatchStatus status);

       // Find dispatches by carrier and status
       List<Dispatch> findByCarrierIdAndStatus(UUID carrierId, Dispatch.DispatchStatus status);

       // Find dispatches by customer and status
       List<Dispatch> findByCustomerIdAndStatus(UUID customerId, Dispatch.DispatchStatus status);

       // Find dispatches by dispatch type and status
       List<Dispatch> findByDispatchTypeAndStatus(Dispatch.DispatchType dispatchType, Dispatch.DispatchStatus status);

       // Find dispatches by priority and status
       List<Dispatch> findByPriorityAndStatus(Dispatch.Priority priority, Dispatch.DispatchStatus status);

       // Find dispatches by date range and status
       @Query("SELECT d FROM Dispatch d WHERE d.dispatchDate >= :startDate AND d.dispatchDate <= :endDate AND d.status = :status")
       List<Dispatch> findByDispatchDateRangeAndStatus(@Param("startDate") OffsetDateTime startDate,
                     @Param("endDate") OffsetDateTime endDate,
                     @Param("status") Dispatch.DispatchStatus status);

       // Find dispatches by estimated delivery range and status
       @Query("SELECT d FROM Dispatch d WHERE d.estimatedDelivery >= :startDate AND d.estimatedDelivery <= :endDate AND d.status = :status")
       List<Dispatch> findByEstimatedDeliveryRangeAndStatus(@Param("startDate") OffsetDateTime startDate,
                     @Param("endDate") OffsetDateTime endDate,
                     @Param("status") Dispatch.DispatchStatus status);

       // Find dispatches by actual delivery range and status
       @Query("SELECT d FROM Dispatch d WHERE d.actualDelivery >= :startDate AND d.actualDelivery <= :endDate AND d.status = :status")
       List<Dispatch> findByActualDeliveryRangeAndStatus(@Param("startDate") OffsetDateTime startDate,
                     @Param("endDate") OffsetDateTime endDate,
                     @Param("status") Dispatch.DispatchStatus status);

       // Find dispatches by weight range
       @Query("SELECT d FROM Dispatch d WHERE d.weight >= :minWeight AND d.weight <= :maxWeight")
       List<Dispatch> findByWeightRange(@Param("minWeight") Double minWeight, @Param("maxWeight") Double maxWeight);

       // Find dispatches by value range
       @Query("SELECT d FROM Dispatch d WHERE d.value >= :minValue AND d.value <= :maxValue")
       List<Dispatch> findByValueRange(@Param("minValue") Double minValue, @Param("maxValue") Double maxValue);

       // Find dispatches by currency
       List<Dispatch> findByCurrencyIgnoreCase(String currency);

       // Find dispatches by dispatched by user
       List<Dispatch> findByDispatchedByIgnoreCaseContaining(String dispatchedBy);

       // Find dispatches by received by user
       List<Dispatch> findByReceivedByIgnoreCaseContaining(String receivedBy);

       // Find dispatches by notes containing text
       List<Dispatch> findByNotesIgnoreCaseContaining(String notes);

       // Find dispatches by dimensions
       @Query("SELECT d FROM Dispatch d WHERE d.dimensionsLength >= :minLength AND d.dimensionsLength <= :maxLength " +
                     "AND d.dimensionsWidth >= :minWidth AND d.dimensionsWidth <= :maxWidth " +
                     "AND d.dimensionsHeight >= :minHeight AND d.dimensionsHeight <= :maxHeight")
       List<Dispatch> findByDimensionsRange(@Param("minLength") Double minLength, @Param("maxLength") Double maxLength,
                     @Param("minWidth") Double minWidth, @Param("maxWidth") Double maxWidth,
                     @Param("minHeight") Double minHeight, @Param("maxHeight") Double maxHeight);

       // Find dispatches by weight unit
       List<Dispatch> findByWeightUnitIgnoreCase(String weightUnit);

       // Find dispatches by dimensions unit
       List<Dispatch> findByDimensionsUnitIgnoreCase(String dimensionsUnit);

       // Find dispatches by order code and status
       List<Dispatch> findByOrderCodeIgnoreCaseAndStatus(String orderCode, Dispatch.DispatchStatus status);

       // Find dispatches by shipment code and status
       List<Dispatch> findByShipmentCodeIgnoreCaseAndStatus(String shipmentCode, Dispatch.DispatchStatus status);

       // Find dispatches by tracking number and status
       List<Dispatch> findByTrackingNumberIgnoreCaseAndStatus(String trackingNumber, Dispatch.DispatchStatus status);

       // Find dispatches by customer name and status
       List<Dispatch> findByCustomerNameIgnoreCaseAndStatus(String customerName, Dispatch.DispatchStatus status);

       // Find dispatches by carrier name and status
       List<Dispatch> findByCarrierNameIgnoreCaseAndStatus(String carrierName, Dispatch.DispatchStatus status);

       // Find dispatches by dispatched by and status
       List<Dispatch> findByDispatchedByIgnoreCaseAndStatus(String dispatchedBy, Dispatch.DispatchStatus status);

       // Find dispatches by received by and status
       List<Dispatch> findByReceivedByIgnoreCaseAndStatus(String receivedBy, Dispatch.DispatchStatus status);

       // Find dispatches by notes and status
       List<Dispatch> findByNotesIgnoreCaseAndStatus(String notes, Dispatch.DispatchStatus status);

       // Find dispatches by currency and status
       List<Dispatch> findByCurrencyIgnoreCaseAndStatus(String currency, Dispatch.DispatchStatus status);

       // Find dispatches by weight unit and status
       List<Dispatch> findByWeightUnitIgnoreCaseAndStatus(String weightUnit, Dispatch.DispatchStatus status);

       // Find dispatches by dimensions unit and status
       List<Dispatch> findByDimensionsUnitIgnoreCaseAndStatus(String dimensionsUnit, Dispatch.DispatchStatus status);

       // Find dispatches by weight range and status
       @Query("SELECT d FROM Dispatch d WHERE d.weight >= :minWeight AND d.weight <= :maxWeight AND d.status = :status")
       List<Dispatch> findByWeightRangeAndStatus(@Param("minWeight") Double minWeight,
                     @Param("maxWeight") Double maxWeight,
                     @Param("status") Dispatch.DispatchStatus status);

       // Find dispatches by value range and status
       @Query("SELECT d FROM Dispatch d WHERE d.value >= :minValue AND d.value <= :maxValue AND d.status = :status")
       List<Dispatch> findByValueRangeAndStatus(@Param("minValue") Double minValue, @Param("maxValue") Double maxValue,
                     @Param("status") Dispatch.DispatchStatus status);

       // Find dispatches by dimensions range and status
       @Query("SELECT d FROM Dispatch d WHERE d.dimensionsLength >= :minLength AND d.dimensionsLength <= :maxLength " +
                     "AND d.dimensionsWidth >= :minWidth AND d.dimensionsWidth <= :maxWidth " +
                     "AND d.dimensionsHeight >= :minHeight AND d.dimensionsHeight <= :maxHeight " +
                     "AND d.status = :status")
       List<Dispatch> findByDimensionsRangeAndStatus(@Param("minLength") Double minLength,
                     @Param("maxLength") Double maxLength,
                     @Param("minWidth") Double minWidth, @Param("maxWidth") Double maxWidth,
                     @Param("minHeight") Double minHeight, @Param("maxHeight") Double maxHeight,
                     @Param("status") Dispatch.DispatchStatus status);

       // Find dispatches by date range with pagination
       @Query("SELECT d FROM Dispatch d WHERE d.dispatchDate >= :startDate AND d.dispatchDate <= :endDate")
       Page<Dispatch> findDispatchesByDispatchDateRange(@Param("startDate") OffsetDateTime startDate,
                     @Param("endDate") OffsetDateTime endDate,
                     Pageable pageable);

       // Find dispatches by estimated delivery range with pagination
       @Query("SELECT d FROM Dispatch d WHERE d.estimatedDelivery >= :startDate AND d.estimatedDelivery <= :endDate")
       Page<Dispatch> findDispatchesByEstimatedDeliveryRange(@Param("startDate") OffsetDateTime startDate,
                     @Param("endDate") OffsetDateTime endDate,
                     Pageable pageable);

       // Find dispatches by actual delivery range with pagination
       @Query("SELECT d FROM Dispatch d WHERE d.actualDelivery >= :startDate AND d.actualDelivery <= :endDate")
       Page<Dispatch> findDispatchesByActualDeliveryRange(@Param("startDate") OffsetDateTime startDate,
                     @Param("endDate") OffsetDateTime endDate,
                     Pageable pageable);

       // Find dispatches by weight range with pagination
       @Query("SELECT d FROM Dispatch d WHERE d.weight >= :minWeight AND d.weight <= :maxWeight")
       Page<Dispatch> findDispatchesByWeightRange(@Param("minWeight") Double minWeight,
                     @Param("maxWeight") Double maxWeight,
                     Pageable pageable);

       // Find dispatches by value range with pagination
       @Query("SELECT d FROM Dispatch d WHERE d.value >= :minValue AND d.value <= :maxValue")
       Page<Dispatch> findDispatchesByValueRange(@Param("minValue") Double minValue, @Param("maxValue") Double maxValue,
                     Pageable pageable);

       // Find dispatches by dimensions range with pagination
       @Query("SELECT d FROM Dispatch d WHERE d.dimensionsLength >= :minLength AND d.dimensionsLength <= :maxLength " +
                     "AND d.dimensionsWidth >= :minWidth AND d.dimensionsWidth <= :maxWidth " +
                     "AND d.dimensionsHeight >= :minHeight AND d.dimensionsHeight <= :maxHeight")
       Page<Dispatch> findDispatchesByDimensionsRange(@Param("minLength") Double minLength,
                     @Param("maxLength") Double maxLength,
                     @Param("minWidth") Double minWidth, @Param("maxWidth") Double maxWidth,
                     @Param("minHeight") Double minHeight, @Param("maxHeight") Double maxHeight,
                     Pageable pageable);
}