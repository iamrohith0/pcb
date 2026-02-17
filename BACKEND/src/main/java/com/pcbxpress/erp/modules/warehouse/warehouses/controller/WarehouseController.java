package com.pcbxpress.erp.modules.warehouse.warehouses.controller;

import com.pcbxpress.erp.modules.warehouse.warehouses.dto.WarehouseDto;
import com.pcbxpress.erp.modules.warehouse.warehouses.dto.WarehousePayload;
import com.pcbxpress.erp.modules.warehouse.warehouses.service.WarehouseService;
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
 * REST Controller for Warehouse management
 */
@RestController
@RequestMapping("/warehouse/warehouses")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    /**
     * GET /api/warehouse/warehouses - List warehouses with optional filters
     */
    @GetMapping
    public ResponseEntity<List<WarehouseDto>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String plantId,
            @RequestParam(required = false) String warehouseType,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Boolean isDefault) {

        List<WarehouseDto> warehouses = warehouseService.list(
                q,
                parseUUID(plantId),
                parseWarehouseType(warehouseType),
                isActive,
                isDefault);

        return ResponseEntity.ok(warehouses);
    }

    /**
     * GET /api/warehouse/warehouses/{id} - Get warehouse by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<WarehouseDto> get(@PathVariable String id) {
        WarehouseDto warehouse = warehouseService.get(id);
        return ResponseEntity.ok(warehouse);
    }

    /**
     * POST /api/warehouse/warehouses - Create new warehouse
     */
    @PostMapping
    public ResponseEntity<WarehouseDto> create(@RequestBody WarehousePayload payload) {
        WarehouseDto created = warehouseService.create(payload);
        return ResponseEntity.ok(created);
    }

    /**
     * PUT /api/warehouse/warehouses/{id} - Update warehouse
     */
    @PutMapping("/{id}")
    public ResponseEntity<WarehouseDto> update(@PathVariable String id, @RequestBody WarehousePayload payload) {
        WarehouseDto updated = warehouseService.update(id, payload);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /api/warehouse/warehouses/{id} - Delete warehouse
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        warehouseService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/warehouse/warehouses/bulk-delete - Delete multiple warehouses
     */
    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> deleteBulk(@RequestBody List<String> ids) {
        warehouseService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/warehouse/warehouses/search - Search warehouses
     */
    @GetMapping("/search")
    public ResponseEntity<List<WarehouseDto>> search(@RequestParam String q) {
        List<WarehouseDto> warehouses = warehouseService.search(q);
        return ResponseEntity.ok(warehouses);
    }

    /**
     * GET /api/warehouse/warehouses/default - Get default warehouse
     */
    @GetMapping("/default")
    public ResponseEntity<WarehouseDto> getDefault() {
        WarehouseDto defaultWarehouse = warehouseService.getDefaultWarehouse();
        return ResponseEntity.ok(defaultWarehouse);
    }

    /**
     * GET /api/warehouse/warehouses/plant/{plantId} - Get warehouses by plant
     */
    @GetMapping("/plant/{plantId}")
    public ResponseEntity<List<WarehouseDto>> getByPlant(@PathVariable String plantId) {
        List<WarehouseDto> warehouses = warehouseService.getByPlant(parseUUID(plantId));
        return ResponseEntity.ok(warehouses);
    }

    /**
     * GET /api/warehouse/warehouses/type/{warehouseType} - Get warehouses by type
     */
    @GetMapping("/type/{warehouseType}")
    public ResponseEntity<List<WarehouseDto>> getByType(@PathVariable String warehouseType) {
        List<WarehouseDto> warehouses = warehouseService.getByType(parseWarehouseType(warehouseType));
        return ResponseEntity.ok(warehouses);
    }

    /**
     * GET /api/warehouse/warehouses/stats - Get warehouse statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = warehouseService.getStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/warehouse/warehouses/export/csv - Export warehouses to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(@RequestParam(required = false) String q) {
        List<WarehouseDto> warehouses = warehouseService.search(q != null ? q : "");
        String csv = warehouseService.exportCsv(warehouses);
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=warehouses.csv")
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

    private com.pcbxpress.erp.modules.warehouse.warehouses.model.Warehouse.WarehouseType parseWarehouseType(
            String typeStr) {
        if (typeStr == null || typeStr.trim().isEmpty()) {
            return null;
        }
        try {
            return com.pcbxpress.erp.modules.warehouse.warehouses.model.Warehouse.WarehouseType
                    .valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}