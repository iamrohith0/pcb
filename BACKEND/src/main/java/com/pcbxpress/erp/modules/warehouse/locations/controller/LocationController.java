package com.pcbxpress.erp.modules.warehouse.locations.controller;

import com.pcbxpress.erp.modules.warehouse.locations.dto.LocationDto;
import com.pcbxpress.erp.modules.warehouse.locations.dto.LocationPayload;
import com.pcbxpress.erp.modules.warehouse.locations.service.LocationService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Location management
 */
@RestController
@RequestMapping("/warehouse/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    /**
     * GET /api/warehouse/locations - List locations with optional filters
     */
    @GetMapping
    public ResponseEntity<List<LocationDto>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String warehouseId,
            @RequestParam(required = false) String locationType,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String zone,
            @RequestParam(required = false) String aisle,
            @RequestParam(required = false) String rack,
            @RequestParam(required = false) String shelf,
            @RequestParam(required = false) String bin,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit) {

        List<LocationDto> locations = locationService.list(
                q,
                parseUUID(warehouseId),
                parseLocationType(locationType),
                isActive,
                parseLocationStatus(status),
                zone,
                aisle,
                rack,
                shelf,
                bin,
                page,
                limit);

        return ResponseEntity.ok(locations);
    }

    /**
     * GET /api/warehouse/locations/{id} - Get location by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<LocationDto> get(@PathVariable String id) {
        LocationDto location = locationService.get(id);
        return ResponseEntity.ok(location);
    }

    /**
     * POST /api/warehouse/locations - Create new location
     */
    @PostMapping
    public ResponseEntity<LocationDto> create(@RequestBody LocationPayload payload) {
        LocationDto created = locationService.create(payload);
        return ResponseEntity.ok(created);
    }

    /**
     * PUT /api/warehouse/locations/{id} - Update location
     */
    @PutMapping("/{id}")
    public ResponseEntity<LocationDto> update(@PathVariable String id, @RequestBody LocationPayload payload) {
        LocationDto updated = locationService.update(id, payload);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/warehouse/locations/{id} - Delete location
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        locationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/warehouse/locations/bulk-delete - Delete multiple locations
     */
    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> deleteBulk(@RequestBody List<String> ids) {
        locationService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/warehouse/locations/search - Search locations
     */
    @GetMapping("/search")
    public ResponseEntity<List<LocationDto>> search(@RequestParam String q) {
        List<LocationDto> locations = locationService.search(q);
        return ResponseEntity.ok(locations);
    }

    /**
     * GET /api/warehouse/locations/warehouse/{warehouseId} - Get locations by
     * warehouse
     */
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<LocationDto>> getByWarehouse(@PathVariable String warehouseId) {
        List<LocationDto> locations = locationService.getByWarehouse(parseUUID(warehouseId));
        return ResponseEntity.ok(locations);
    }

    /**
     * GET /api/warehouse/locations/type/{locationType} - Get locations by type
     */
    @GetMapping("/type/{locationType}")
    public ResponseEntity<List<LocationDto>> getByType(@PathVariable String locationType) {
        List<LocationDto> locations = locationService.getByType(parseLocationType(locationType));
        return ResponseEntity.ok(locations);
    }

    /**
     * GET /api/warehouse/locations/status/{status} - Get locations by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<LocationDto>> getByStatus(@PathVariable String status) {
        List<LocationDto> locations = locationService.getByStatus(parseLocationStatus(status));
        return ResponseEntity.ok(locations);
    }

    /**
     * GET /api/warehouse/locations/zone/{zone} - Get locations by zone
     */
    @GetMapping("/zone/{zone}")
    public ResponseEntity<List<LocationDto>> getByZone(@PathVariable String zone) {
        List<LocationDto> locations = locationService.getByZone(zone);
        return ResponseEntity.ok(locations);
    }

    /**
     * GET /api/warehouse/locations/aisle/{aisle} - Get locations by aisle
     */
    @GetMapping("/aisle/{aisle}")
    public ResponseEntity<List<LocationDto>> getByAisle(@PathVariable String aisle) {
        List<LocationDto> locations = locationService.getByAisle(aisle);
        return ResponseEntity.ok(locations);
    }

    /**
     * GET /api/warehouse/locations/rack/{rack} - Get locations by rack
     */
    @GetMapping("/rack/{rack}")
    public ResponseEntity<List<LocationDto>> getByRack(@PathVariable String rack) {
        List<LocationDto> locations = locationService.getByRack(rack);
        return ResponseEntity.ok(locations);
    }

    /**
     * GET /api/warehouse/locations/shelf/{shelf} - Get locations by shelf
     */
    @GetMapping("/shelf/{shelf}")
    public ResponseEntity<List<LocationDto>> getByShelf(@PathVariable String shelf) {
        List<LocationDto> locations = locationService.getByShelf(shelf);
        return ResponseEntity.ok(locations);
    }

    /**
     * GET /api/warehouse/locations/bin/{bin} - Get locations by bin
     */
    @GetMapping("/bin/{bin}")
    public ResponseEntity<List<LocationDto>> getByBin(@PathVariable String bin) {
        List<LocationDto> locations = locationService.getByBin(bin);
        return ResponseEntity.ok(locations);
    }

    /**
     * GET /api/warehouse/locations/stats - Get location statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = locationService.getStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/warehouse/locations/export/csv - Export locations to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(@RequestParam(required = false) String q) {
        List<LocationDto> locations = locationService.search(q != null ? q : "");
        String csv = locationService.exportCsv(locations);
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=locations.csv")
                .body(csv);
    }

    // Helper methods

    private java.util.UUID parseUUID(String uuidStr) {
        if (uuidStr == null || uuidStr.trim().isEmpty()) {
            return null;
        }
        try {
            return java.util.UUID.fromString(uuidStr);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private com.pcbxpress.erp.modules.warehouse.locations.model.Location.LocationType parseLocationType(
            String typeStr) {
        if (typeStr == null || typeStr.trim().isEmpty()) {
            return null;
        }
        try {
            return com.pcbxpress.erp.modules.warehouse.locations.model.Location.LocationType
                    .valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private com.pcbxpress.erp.modules.warehouse.locations.model.Location.LocationStatus parseLocationStatus(
            String statusStr) {
        if (statusStr == null || statusStr.trim().isEmpty()) {
            return null;
        }
        try {
            return com.pcbxpress.erp.modules.warehouse.locations.model.Location.LocationStatus
                    .valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}