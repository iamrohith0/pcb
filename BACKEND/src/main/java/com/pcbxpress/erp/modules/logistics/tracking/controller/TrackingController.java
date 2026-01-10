package com.pcbxpress.erp.modules.logistics.tracking.controller;

import com.pcbxpress.erp.modules.logistics.tracking.dto.TrackingDto;
import com.pcbxpress.erp.modules.logistics.tracking.dto.TrackingPayload;
import com.pcbxpress.erp.modules.logistics.tracking.model.Tracking;
import com.pcbxpress.erp.modules.logistics.tracking.service.TrackingService;
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
 * REST Controller for Tracking operations
 */
@RestController
@RequestMapping("/api/logistics/tracking")
public class TrackingController {

    private final TrackingService trackingService;

    @Autowired
    public TrackingController(TrackingService trackingService) {
        this.trackingService = trackingService;
    }

    /**
     * Get all tracking records with optional filters
     */
    @GetMapping
    public ResponseEntity<List<TrackingDto>> getAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID shipmentId,
            @RequestParam(required = false) UUID packageId,
            @RequestParam(required = false) UUID carrierId,
            @RequestParam(required = false) Tracking.TrackingStatus status,
            @RequestParam(required = false) Tracking.TrackingType trackingType,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<TrackingDto> trackings = trackingService.list(query, shipmentId, packageId, carrierId, 
            status, trackingType, isActive, startDate, endDate);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get all tracking records with pagination
     */
    @GetMapping("/page")
    public ResponseEntity<Page<TrackingDto>> getAllWithPagination(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID shipmentId,
            @RequestParam(required = false) UUID packageId,
            @RequestParam(required = false) UUID carrierId,
            @RequestParam(required = false) Tracking.TrackingStatus status,
            @RequestParam(required = false) Tracking.TrackingType trackingType,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate,
            Pageable pageable) {
        
        Page<TrackingDto> trackings = trackingService.listWithPagination(query, shipmentId, packageId, carrierId, 
            status, trackingType, isActive, startDate, endDate, pageable);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get a single tracking record by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TrackingDto> getById(@PathVariable String id) {
        TrackingDto tracking = trackingService.get(id);
        return ResponseEntity.ok(tracking);
    }

    /**
     * Get tracking by tracking ID
     */
    @GetMapping("/by-tracking-id/{trackingId}")
    public ResponseEntity<TrackingDto> getByTrackingId(@PathVariable String trackingId) {
        TrackingDto tracking = trackingService.getByTrackingId(trackingId);
        return ResponseEntity.ok(tracking);
    }

    /**
     * Create a new tracking record
     */
    @PostMapping
    public ResponseEntity<TrackingDto> create(@RequestBody TrackingPayload tracking) {
        TrackingDto created = trackingService.create(tracking);
        return ResponseEntity.ok(created);
    }

    /**
     * Update an existing tracking record
     */
    @PutMapping("/{id}")
    public ResponseEntity<TrackingDto> update(@PathVariable String id, @RequestBody TrackingPayload tracking) {
        TrackingDto updated = trackingService.update(id, tracking);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a tracking record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        trackingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Delete multiple tracking records
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> deleteBulk(@RequestBody List<String> ids) {
        trackingService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search tracking records by query
     */
    @GetMapping("/search")
    public ResponseEntity<List<TrackingDto>> search(@RequestParam String query) {
        List<TrackingDto> trackings = trackingService.search(query);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking history for a tracking ID
     */
    @GetMapping("/{trackingId}/history")
    public ResponseEntity<List<TrackingDto>> getTrackingHistory(
            @PathVariable String trackingId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<TrackingDto> trackings = trackingService.getTrackingHistory(trackingId, status, startDate, endDate);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Update tracking status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TrackingDto> updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        String statusDescription = request.get("statusDescription");
        
        if (status == null) {
            return ResponseEntity.badRequest().build();
        }
        
        Tracking.TrackingStatus trackingStatus = Tracking.TrackingStatus.valueOf(status.toUpperCase());
        TrackingDto updated = trackingService.updateStatus(id, trackingStatus, statusDescription);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update tracking location
     */
    @PatchMapping("/{id}/location")
    public ResponseEntity<TrackingDto> updateLocation(@PathVariable String id, @RequestBody Map<String, Object> request) {
        String locationName = (String) request.get("locationName");
        String locationAddress = (String) request.get("locationAddress");
        String locationCity = (String) request.get("locationCity");
        String locationState = (String) request.get("locationState");
        String locationCountry = (String) request.get("locationCountry");
        String locationPostalCode = (String) request.get("locationPostalCode");
        Double latitude = request.get("latitude") != null ? Double.parseDouble(request.get("latitude").toString()) : null;
        Double longitude = request.get("longitude") != null ? Double.parseDouble(request.get("longitude").toString()) : null;
        
        TrackingDto updated = trackingService.updateLocation(id, locationName, locationAddress, locationCity, 
            locationState, locationCountry, locationPostalCode, 
            latitude != null ? java.math.BigDecimal.valueOf(latitude) : null,
            longitude != null ? java.math.BigDecimal.valueOf(longitude) : null);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update tracking event time
     */
    @PatchMapping("/{id}/event-time")
    public ResponseEntity<TrackingDto> updateEventTime(@PathVariable String id, @RequestBody Map<String, String> request) {
        String eventTime = request.get("eventTime");
        
        if (eventTime == null) {
            return ResponseEntity.badRequest().build();
        }
        
        TrackingDto updated = trackingService.updateEventTime(id, OffsetDateTime.parse(eventTime));
        return ResponseEntity.ok(updated);
    }

    /**
     * Update tracking delivery information
     */
    @PatchMapping("/{id}/delivery")
    public ResponseEntity<TrackingDto> updateDelivery(@PathVariable String id, @RequestBody Map<String, Object> request) {
        String actualDelivery = (String) request.get("actualDelivery");
        String deliverySignature = (String) request.get("deliverySignature");
        String deliveryNotes = (String) request.get("deliveryNotes");
        Integer deliveryAttemptCount = request.get("deliveryAttemptCount") != null ? Integer.parseInt(request.get("deliveryAttemptCount").toString()) : null;
        String deliveryContactName = (String) request.get("deliveryContactName");
        String deliveryContactPhone = (String) request.get("deliveryContactPhone");
        String deliveryContactEmail = (String) request.get("deliveryContactEmail");
        
        TrackingDto updated = trackingService.updateDelivery(id, 
            actualDelivery != null ? OffsetDateTime.parse(actualDelivery) : null,
            deliverySignature,
            deliveryNotes,
            deliveryAttemptCount,
            deliveryContactName,
            deliveryContactPhone,
            deliveryContactEmail);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update tracking coordinates
     */
    @PatchMapping("/{id}/coordinates")
    public ResponseEntity<TrackingDto> updateCoordinates(@PathVariable String id, @RequestBody Map<String, Object> request) {
        Double latitude = request.get("latitude") != null ? Double.parseDouble(request.get("latitude").toString()) : null;
        Double longitude = request.get("longitude") != null ? Double.parseDouble(request.get("longitude").toString()) : null;
        
        TrackingDto updated = trackingService.updateCoordinates(id, 
            latitude != null ? java.math.BigDecimal.valueOf(latitude) : null,
            longitude != null ? java.math.BigDecimal.valueOf(longitude) : null);
        return ResponseEntity.ok(updated);
    }

    /**
     * Get real-time location for a tracking ID
     */
    @GetMapping("/{trackingId}/location")
    public ResponseEntity<TrackingDto> getRealTimeLocation(@PathVariable String trackingId) {
        TrackingDto tracking = trackingService.getRealTimeLocation(trackingId);
        return ResponseEntity.ok(tracking);
    }

    /**
     * Get delivery estimate for a tracking ID
     */
    @GetMapping("/{trackingId}/estimate")
    public ResponseEntity<OffsetDateTime> getDeliveryEstimate(@PathVariable String trackingId) {
        OffsetDateTime estimate = trackingService.getDeliveryEstimate(trackingId);
        return ResponseEntity.ok(estimate);
    }

    /**
     * Get tracking report
     */
    @GetMapping("/report")
    public ResponseEntity<Map<String, Object>> getTrackingReport(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        Map<String, Object> report = trackingService.getTrackingReport(status, startDate, endDate);
        return ResponseEntity.ok(report);
    }

    /**
     * Export tracking records to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID shipmentId,
            @RequestParam(required = false) UUID packageId,
            @RequestParam(required = false) UUID carrierId,
            @RequestParam(required = false) Tracking.TrackingStatus status,
            @RequestParam(required = false) Tracking.TrackingType trackingType,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<TrackingDto> trackings = trackingService.list(query, shipmentId, packageId, carrierId, 
            status, trackingType, isActive, startDate, endDate);
        
        String csv = trackingService.exportCsv(trackings);
        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .header("Content-Disposition", "attachment; filename=tracking.csv")
            .body(csv);
    }

    /**
     * Get tracking by shipment
     */
    @GetMapping("/shipment/{shipmentId}")
    public ResponseEntity<List<TrackingDto>> getByShipment(@PathVariable UUID shipmentId) {
        List<TrackingDto> trackings = trackingService.getByShipment(shipmentId);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking by shipment code
     */
    @GetMapping("/shipment-code/{shipmentCode}")
    public ResponseEntity<List<TrackingDto>> getByShipmentCode(@PathVariable String shipmentCode) {
        List<TrackingDto> trackings = trackingService.getByShipmentCode(shipmentCode);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking by package
     */
    @GetMapping("/package/{packageId}")
    public ResponseEntity<List<TrackingDto>> getByPackage(@PathVariable UUID packageId) {
        List<TrackingDto> trackings = trackingService.getByPackage(packageId);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking by package code
     */
    @GetMapping("/package-code/{packageCode}")
    public ResponseEntity<List<TrackingDto>> getByPackageCode(@PathVariable String packageCode) {
        List<TrackingDto> trackings = trackingService.getByPackageCode(packageCode);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking by carrier
     */
    @GetMapping("/carrier/{carrierId}")
    public ResponseEntity<List<TrackingDto>> getByCarrier(@PathVariable UUID carrierId) {
        List<TrackingDto> trackings = trackingService.getByCarrier(carrierId);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<TrackingDto>> getByStatus(@PathVariable Tracking.TrackingStatus status) {
        List<TrackingDto> trackings = trackingService.getByStatus(status);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking by type
     */
    @GetMapping("/type/{trackingType}")
    public ResponseEntity<List<TrackingDto>> getByType(@PathVariable Tracking.TrackingType trackingType) {
        List<TrackingDto> trackings = trackingService.getByType(trackingType);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking by active status
     */
    @GetMapping("/active/{isActive}")
    public ResponseEntity<List<TrackingDto>> getByActive(@PathVariable Boolean isActive) {
        List<TrackingDto> trackings = trackingService.getByActive(isActive);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking by date range
     */
    @GetMapping("/date-range")
    public ResponseEntity<List<TrackingDto>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<TrackingDto> trackings = trackingService.getByDateRange(startDate, endDate);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking by estimated delivery range
     */
    @GetMapping("/estimated-delivery-range")
    public ResponseEntity<List<TrackingDto>> getByEstimatedDeliveryRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<TrackingDto> trackings = trackingService.getByEstimatedDeliveryRange(startDate, endDate);
        return ResponseEntity.ok(trackings);
    }

    /**
     * Get tracking by actual delivery range
     */
    @GetMapping("/actual-delivery-range")
    public ResponseEntity<List<TrackingDto>> getByActualDeliveryRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime endDate) {
        
        List<TrackingDto> trackings = trackingService.getByActualDeliveryRange(startDate, endDate);
        return ResponseEntity.ok(trackings);
    }
}