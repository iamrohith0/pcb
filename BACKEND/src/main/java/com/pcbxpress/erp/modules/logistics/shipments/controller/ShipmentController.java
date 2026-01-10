package com.pcbxpress.erp.modules.logistics.shipments.controller;

import com.pcbxpress.erp.modules.logistics.shipments.dto.ShipmentDto;
import com.pcbxpress.erp.modules.logistics.shipments.dto.ShipmentPayload;
import com.pcbxpress.erp.modules.logistics.shipments.model.Shipment;
import com.pcbxpress.erp.modules.logistics.shipments.service.ShipmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Shipment operations
 */
@RestController
@RequestMapping("/api/logistics/shipments")
public class ShipmentController {

    private final ShipmentService shipmentService;

    @Autowired
    public ShipmentController(ShipmentService shipmentService) {
        this.shipmentService = shipmentService;
    }

    /**
     * Get all shipments with optional filters
     */
    @GetMapping
    public ResponseEntity<List<ShipmentDto>> getAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID carrierId,
            @RequestParam(required = false) Shipment.ShipmentStatus status,
            @RequestParam(required = false) Shipment.Priority priority,
            @RequestParam(required = false) Shipment.ShipmentType shipmentType,
            @RequestParam(required = false) Shipment.ServiceLevel serviceLevel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<ShipmentDto> shipments = shipmentService.list(query, orderId, customerId, warehouseId, 
            carrierId, status, priority, shipmentType, serviceLevel, startDate, endDate);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get all shipments with pagination
     */
    @GetMapping("/page")
    public ResponseEntity<Page<ShipmentDto>> getAllWithPagination(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID carrierId,
            @RequestParam(required = false) Shipment.ShipmentStatus status,
            @RequestParam(required = false) Shipment.Priority priority,
            @RequestParam(required = false) Shipment.ShipmentType shipmentType,
            @RequestParam(required = false) Shipment.ServiceLevel serviceLevel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            Pageable pageable) {
        
        Page<ShipmentDto> shipments = shipmentService.listWithPagination(query, orderId, customerId, warehouseId, 
            carrierId, status, priority, shipmentType, serviceLevel, startDate, endDate, pageable);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get a single shipment by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ShipmentDto> getById(@PathVariable String id) {
        ShipmentDto shipment = shipmentService.get(id);
        return ResponseEntity.ok(shipment);
    }

    /**
     * Create a new shipment
     */
    @PostMapping
    public ResponseEntity<ShipmentDto> create(@RequestBody ShipmentPayload shipment) {
        ShipmentDto created = shipmentService.create(shipment);
        return ResponseEntity.ok(created);
    }

    /**
     * Update an existing shipment
     */
    @PutMapping("/{id}")
    public ResponseEntity<ShipmentDto> update(@PathVariable String id, @RequestBody ShipmentPayload shipment) {
        ShipmentDto updated = shipmentService.update(id, shipment);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a shipment
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        shipmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete multiple shipments
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> deleteBulk(@RequestBody List<String> ids) {
        shipmentService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search shipments by query
     */
    @GetMapping("/search")
    public ResponseEntity<List<ShipmentDto>> search(@RequestParam String query) {
        List<ShipmentDto> shipments = shipmentService.search(query);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipment history for an order
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<ShipmentDto>> getShipmentHistory(
            @PathVariable UUID orderId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<ShipmentDto> shipments = shipmentService.getShipmentHistory(orderId, status, startDate, endDate);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Update shipment status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ShipmentDto> updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Shipment.ShipmentStatus shipmentStatus = Shipment.ShipmentStatus.valueOf(status.toUpperCase());
        ShipmentDto updated = shipmentService.updateStatus(id, shipmentStatus);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update shipment tracking information
     */
    @PatchMapping("/{id}/tracking")
    public ResponseEntity<ShipmentDto> updateTracking(@PathVariable String id, @RequestBody Map<String, Object> request) {
        String trackingNumber = (String) request.get("trackingNumber");
        OffsetDateTime estimatedDelivery = request.get("estimatedDelivery") != null ? 
            OffsetDateTime.parse(request.get("estimatedDelivery").toString()) : null;
        
        ShipmentDto updated = shipmentService.updateTracking(id, trackingNumber, estimatedDelivery);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update shipment delivery information
     */
    @PatchMapping("/{id}/delivery")
    public ResponseEntity<ShipmentDto> updateDelivery(@PathVariable String id, @RequestBody Map<String, Object> request) {
        OffsetDateTime actualDelivery = request.get("actualDelivery") != null ? 
            OffsetDateTime.parse(request.get("actualDelivery").toString()) : null;
        String receivedBy = (String) request.get("receivedBy");
        
        ShipmentDto updated = shipmentService.updateDelivery(id, actualDelivery, receivedBy);
        return ResponseEntity.ok(updated);
    }

    /**
     * Assign carrier to shipment
     */
    @PatchMapping("/{id}/carrier")
    public ResponseEntity<ShipmentDto> assignCarrier(@PathVariable String id, @RequestBody Map<String, Object> request) {
        UUID carrierId = request.get("carrierId") != null ? UUID.fromString(request.get("carrierId").toString()) : null;
        String carrierName = (String) request.get("carrierName");
        
        ShipmentDto updated = shipmentService.assignCarrier(id, carrierId, carrierName);
        return ResponseEntity.ok(updated);
    }

    /**
     * Mark shipment as shipped
     */
    @PatchMapping("/{id}/shipped")
    public ResponseEntity<ShipmentDto> markAsShipped(@PathVariable String id, @RequestBody Map<String, String> request) {
        String shippedBy = request.get("shippedBy");
        
        ShipmentDto updated = shipmentService.markAsShipped(id, shippedBy);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update shipment charges
     */
    @PatchMapping("/{id}/charges")
    public ResponseEntity<ShipmentDto> updateCharges(@PathVariable String id, @RequestBody Map<String, Object> request) {
        BigDecimal freightCharge = request.get("freightCharge") != null ? 
            new BigDecimal(request.get("freightCharge").toString()) : null;
        BigDecimal handlingCharge = request.get("handlingCharge") != null ? 
            new BigDecimal(request.get("handlingCharge").toString()) : null;
        BigDecimal customsCharge = request.get("customsCharge") != null ? 
            new BigDecimal(request.get("customsCharge").toString()) : null;
        BigDecimal insuranceValue = request.get("insuranceValue") != null ? 
            new BigDecimal(request.get("insuranceValue").toString()) : null;
        
        ShipmentDto updated = shipmentService.updateCharges(id, freightCharge, handlingCharge, customsCharge, insuranceValue);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get shipment report
     */
    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getShipmentReport(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        Map<String, Object> report = shipmentService.getShipmentReport(status, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Get upcoming shipments
     */
    @GetMapping("/upcoming")
    public ResponseEntity<List<ShipmentDto>> getUpcomingShipments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            @RequestParam(required = false) Shipment.ShipmentStatus status) {
        
        List<ShipmentDto> shipments = shipmentService.getUpcomingShipments(startDate, endDate, status);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Export shipments to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID orderId,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID carrierId,
            @RequestParam(required = false) Shipment.ShipmentStatus status,
            @RequestParam(required = false) Shipment.Priority priority,
            @RequestParam(required = false) Shipment.ShipmentType shipmentType,
            @RequestParam(required = false) Shipment.ServiceLevel serviceLevel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<ShipmentDto> shipments = shipmentService.list(query, orderId, customerId, warehouseId, 
            carrierId, status, priority, shipmentType, serviceLevel, startDate, endDate);
        
        String csv = shipmentService.exportCsv(shipments);
        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .header("Content-Disposition", "attachment; filename=shipments.csv")
            .body(csv);
    }

    /**
     * Get shipments by order
     */
    @GetMapping("/by-order/{orderId}")
    public ResponseEntity<List<ShipmentDto>> getByOrder(@PathVariable UUID orderId) {
        List<ShipmentDto> shipments = shipmentService.getByOrder(orderId);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by customer
     */
    @GetMapping("/by-customer/{customerId}")
    public ResponseEntity<List<ShipmentDto>> getByCustomer(@PathVariable UUID customerId) {
        List<ShipmentDto> shipments = shipmentService.getByCustomer(customerId);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by warehouse
     */
    @GetMapping("/by-warehouse/{warehouseId}")
    public ResponseEntity<List<ShipmentDto>> getByWarehouse(@PathVariable UUID warehouseId) {
        List<ShipmentDto> shipments = shipmentService.getByWarehouse(warehouseId);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by carrier
     */
    @GetMapping("/by-carrier/{carrierId}")
    public ResponseEntity<List<ShipmentDto>> getByCarrier(@PathVariable UUID carrierId) {
        List<ShipmentDto> shipments = shipmentService.getByCarrier(carrierId);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by status
     */
    @GetMapping("/by-status/{status}")
    public ResponseEntity<List<ShipmentDto>> getByStatus(@PathVariable Shipment.ShipmentStatus status) {
        List<ShipmentDto> shipments = shipmentService.getByStatus(status);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by priority
     */
    @GetMapping("/by-priority/{priority}")
    public ResponseEntity<List<ShipmentDto>> getByPriority(@PathVariable Shipment.Priority priority) {
        List<ShipmentDto> shipments = shipmentService.getByPriority(priority);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by type
     */
    @GetMapping("/by-type/{shipmentType}")
    public ResponseEntity<List<ShipmentDto>> getByType(@PathVariable Shipment.ShipmentType shipmentType) {
        List<ShipmentDto> shipments = shipmentService.getByType(shipmentType);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by service level
     */
    @GetMapping("/by-service-level/{serviceLevel}")
    public ResponseEntity<List<ShipmentDto>> getByServiceLevel(@PathVariable Shipment.ServiceLevel serviceLevel) {
        List<ShipmentDto> shipments = shipmentService.getByServiceLevel(serviceLevel);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by tracking number
     */
    @GetMapping("/by-tracking/{trackingNumber}")
    public ResponseEntity<List<ShipmentDto>> getByTrackingNumber(@PathVariable String trackingNumber) {
        List<ShipmentDto> shipments = shipmentService.getByTrackingNumber(trackingNumber);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by date range
     */
    @GetMapping("/by-date-range")
    public ResponseEntity<List<ShipmentDto>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<ShipmentDto> shipments = shipmentService.getByDateRange(startDate, endDate);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by estimated delivery range
     */
    @GetMapping("/by-estimated-delivery-range")
    public ResponseEntity<List<ShipmentDto>> getByEstimatedDeliveryRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<ShipmentDto> shipments = shipmentService.getByEstimatedDeliveryRange(startDate, endDate);
        return ResponseEntity.ok(shipments);
    }

    /**
     * Get shipments by actual delivery range
     */
    @GetMapping("/by-actual-delivery-range")
    public ResponseEntity<List<ShipmentDto>> getByActualDeliveryRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<ShipmentDto> shipments = shipmentService.getByActualDeliveryRange(startDate, endDate);
        return ResponseEntity.ok(shipments);
    }
}