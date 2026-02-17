package com.pcbxpress.erp.modules.logistics.dispatch.controller;

import com.pcbxpress.erp.modules.logistics.dispatch.dto.DispatchDto;
import com.pcbxpress.erp.modules.logistics.dispatch.dto.DispatchPayload;
import com.pcbxpress.erp.modules.logistics.dispatch.model.Dispatch;
import com.pcbxpress.erp.modules.logistics.dispatch.service.DispatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Dispatch operations
 */
@RestController
@RequestMapping("/logistics/dispatch")
public class DispatchController {

    private final DispatchService dispatchService;

    @Autowired
    public DispatchController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    /**
     * Get all dispatches with optional filters
     */
    @GetMapping
    public ResponseEntity<List<DispatchDto>> getAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID carrierId,
            @RequestParam(required = false) Dispatch.DispatchStatus status,
            @RequestParam(required = false) Dispatch.Priority priority,
            @RequestParam(required = false) Dispatch.DispatchType dispatchType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {

        List<DispatchDto> dispatches = dispatchService.list(query, orderId, customerId, warehouseId,
                carrierId, status, priority, dispatchType, startDate, endDate);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get all dispatches with pagination
     */
    @GetMapping("/page")
    public ResponseEntity<Page<DispatchDto>> getAllWithPagination(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID carrierId,
            @RequestParam(required = false) Dispatch.DispatchStatus status,
            @RequestParam(required = false) Dispatch.Priority priority,
            @RequestParam(required = false) Dispatch.DispatchType dispatchType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            Pageable pageable) {

        Page<DispatchDto> dispatches = dispatchService.listWithPagination(query, orderId, customerId, warehouseId,
                carrierId, status, priority, dispatchType, startDate, endDate, pageable);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get a single dispatch by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<DispatchDto> getById(@PathVariable String id) {
        DispatchDto dispatch = dispatchService.get(id);
        return ResponseEntity.ok(dispatch);
    }

    /**
     * Create a new dispatch
     */
    @PostMapping
    public ResponseEntity<DispatchDto> create(@RequestBody DispatchPayload dispatch) {
        DispatchDto created = dispatchService.create(dispatch);
        return ResponseEntity.ok(created);
    }

    /**
     * Update an existing dispatch
     */
    @PutMapping("/{id}")
    public ResponseEntity<DispatchDto> update(@PathVariable String id, @RequestBody DispatchPayload dispatch) {
        DispatchDto updated = dispatchService.update(id, dispatch);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a dispatch
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        dispatchService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete multiple dispatches
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> deleteBulk(@RequestBody List<String> ids) {
        dispatchService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search dispatches by query
     */
    @GetMapping("/search")
    public ResponseEntity<List<DispatchDto>> search(@RequestParam String query) {
        List<DispatchDto> dispatches = dispatchService.search(query);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatch history for an order
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<DispatchDto>> getDispatchHistory(
            @PathVariable UUID orderId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {

        List<DispatchDto> dispatches = dispatchService.getDispatchHistory(orderId, status, startDate, endDate);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Update dispatch status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<DispatchDto> updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().build();
        }

        Dispatch.DispatchStatus dispatchStatus = Dispatch.DispatchStatus.valueOf(status.toUpperCase());
        DispatchDto updated = dispatchService.updateStatus(id, dispatchStatus);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update dispatch tracking information
     */
    @PatchMapping("/{id}/tracking")
    public ResponseEntity<DispatchDto> updateTracking(@PathVariable String id,
            @RequestBody Map<String, Object> request) {
        String trackingNumber = (String) request.get("trackingNumber");
        OffsetDateTime estimatedDelivery = request.get("estimatedDelivery") != null
                ? OffsetDateTime.parse(request.get("estimatedDelivery").toString())
                : null;

        DispatchDto updated = dispatchService.updateTracking(id, trackingNumber, estimatedDelivery);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update dispatch delivery information
     */
    @PatchMapping("/{id}/delivery")
    public ResponseEntity<DispatchDto> updateDelivery(@PathVariable String id,
            @RequestBody Map<String, Object> request) {
        OffsetDateTime actualDelivery = request.get("actualDelivery") != null
                ? OffsetDateTime.parse(request.get("actualDelivery").toString())
                : null;
        String receivedBy = (String) request.get("receivedBy");

        DispatchDto updated = dispatchService.updateDelivery(id, actualDelivery, receivedBy);
        return ResponseEntity.ok(updated);
    }

    /**
     * Assign carrier to dispatch
     */
    @PatchMapping("/{id}/carrier")
    public ResponseEntity<DispatchDto> assignCarrier(@PathVariable String id,
            @RequestBody Map<String, Object> request) {
        UUID carrierId = request.get("carrierId") != null ? UUID.fromString(request.get("carrierId").toString()) : null;
        String carrierName = (String) request.get("carrierName");

        DispatchDto updated = dispatchService.assignCarrier(id, carrierId, carrierName);
        return ResponseEntity.ok(updated);
    }

    /**
     * Mark dispatch as dispatched
     */
    @PatchMapping("/{id}/dispatched")
    public ResponseEntity<DispatchDto> markAsDispatched(@PathVariable String id,
            @RequestBody Map<String, String> request) {
        String dispatchedBy = request.get("dispatchedBy");

        DispatchDto updated = dispatchService.markAsDispatched(id, dispatchedBy);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get dispatch report
     */
    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getDispatchReport(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {

        Map<String, Object> report = dispatchService.getDispatchReport(status, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Get upcoming dispatches
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<DispatchDto>> getUpcomingDispatches(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @RequestParam(required = false) Dispatch.DispatchStatus status) {

        List<DispatchDto> dispatches = dispatchService.getUpcomingDispatches(startDate, endDate, status);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Export dispatches to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID carrierId,
            @RequestParam(required = false) Dispatch.DispatchStatus status,
            @RequestParam(required = false) Dispatch.Priority priority,
            @RequestParam(required = false) Dispatch.DispatchType dispatchType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {

        List<DispatchDto> dispatches = dispatchService.list(query, orderId, customerId, warehouseId,
                carrierId, status, priority, dispatchType, startDate, endDate);

        String csv = dispatchService.exportCsv(dispatches);
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=dispatches.csv")
                .body(csv);
    }

    /**
     * Get dispatches by order
     */
    @GetMapping("/by-order/{orderId}")
    public ResponseEntity<List<DispatchDto>> getByOrder(@PathVariable UUID orderId) {
        List<DispatchDto> dispatches = dispatchService.getByOrder(orderId);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by customer
     */
    @GetMapping("/by-customer/{customerId}")
    public ResponseEntity<List<DispatchDto>> getByCustomer(@PathVariable UUID customerId) {
        List<DispatchDto> dispatches = dispatchService.getByCustomer(customerId);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by warehouse
     */
    @GetMapping("/by-warehouse/{warehouseId}")
    public ResponseEntity<List<DispatchDto>> getByWarehouse(@PathVariable UUID warehouseId) {
        List<DispatchDto> dispatches = dispatchService.getByWarehouse(warehouseId);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by carrier
     */
    @GetMapping("/by-carrier/{carrierId}")
    public ResponseEntity<List<DispatchDto>> getByCarrier(@PathVariable UUID carrierId) {
        List<DispatchDto> dispatches = dispatchService.getByCarrier(carrierId);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by shipment
     */
    @GetMapping("/by-shipment/{shipmentId}")
    public ResponseEntity<List<DispatchDto>> getByShipment(@PathVariable UUID shipmentId) {
        List<DispatchDto> dispatches = dispatchService.getByShipment(shipmentId);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by status
     */
    @GetMapping("/by-status/{status}")
    public ResponseEntity<List<DispatchDto>> getByStatus(@PathVariable Dispatch.DispatchStatus status) {
        List<DispatchDto> dispatches = dispatchService.getByStatus(status);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by priority
     */
    @GetMapping("/by-priority/{priority}")
    public ResponseEntity<List<DispatchDto>> getByPriority(@PathVariable Dispatch.Priority priority) {
        List<DispatchDto> dispatches = dispatchService.getByPriority(priority);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by type
     */
    @GetMapping("/by-type/{dispatchType}")
    public ResponseEntity<List<DispatchDto>> getByType(@PathVariable Dispatch.DispatchType dispatchType) {
        List<DispatchDto> dispatches = dispatchService.getByType(dispatchType);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by tracking number
     */
    @GetMapping("/by-tracking/{trackingNumber}")
    public ResponseEntity<List<DispatchDto>> getByTrackingNumber(@PathVariable String trackingNumber) {
        List<DispatchDto> dispatches = dispatchService.getByTrackingNumber(trackingNumber);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by date range
     */
    @GetMapping("/by-date-range")
    public ResponseEntity<List<DispatchDto>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {

        List<DispatchDto> dispatches = dispatchService.getByDateRange(startDate, endDate);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by estimated delivery range
     */
    @GetMapping("/by-estimated-delivery-range")
    public ResponseEntity<List<DispatchDto>> getByEstimatedDeliveryRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {

        List<DispatchDto> dispatches = dispatchService.getByEstimatedDeliveryRange(startDate, endDate);
        return ResponseEntity.ok(dispatches);
    }

    /**
     * Get dispatches by actual delivery range
     */
    @GetMapping("/by-actual-delivery-range")
    public ResponseEntity<List<DispatchDto>> getByActualDeliveryRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {

        List<DispatchDto> dispatches = dispatchService.getByActualDeliveryRange(startDate, endDate);
        return ResponseEntity.ok(dispatches);
    }
}