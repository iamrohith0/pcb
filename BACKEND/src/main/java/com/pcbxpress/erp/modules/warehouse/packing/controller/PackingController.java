package com.pcbxpress.erp.modules.warehouse.packing.controller;

import com.pcbxpress.erp.modules.warehouse.packing.dto.PackingDto;
import com.pcbxpress.erp.modules.warehouse.packing.dto.PackingPayload;
import com.pcbxpress.erp.modules.warehouse.packing.service.PackingService;
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
 * REST Controller for Packing management
 */
@RestController
@RequestMapping("/api/warehouse/packing")
public class PackingController {
    
    private final PackingService packingService;
    
    public PackingController(PackingService packingService) {
        this.packingService = packingService;
    }
    
    /**
     * GET /api/warehouse/packing - List packings with optional filters
     */
    @GetMapping
    public ResponseEntity<List<PackingDto>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String warehouseId,
            @RequestParam(required = false) String locationId,
            @RequestParam(required = false) String itemId,
            @RequestParam(required = false) String batchId,
            @RequestParam(required = false) String serialId,
            @RequestParam(required = false) String shipmentId,
            @RequestParam(required = false) String pickListId,
            @RequestParam(required = false) String workOrder,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String packingType,
            @RequestParam(required = false) String cartonType) {
        
        List<PackingDto> packings = packingService.list(
            q,
            parseUUID(warehouseId),
            parseUUID(locationId),
            parseUUID(itemId),
            parseUUID(batchId),
            parseUUID(serialId),
            parseUUID(shipmentId),
            parseUUID(pickListId),
            workOrder,
            parsePackingStatus(status),
            parsePriority(priority),
            parsePackingType(packingType),
            cartonType
        );
        
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/{id} - Get packing by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PackingDto> get(@PathVariable String id) {
        PackingDto packing = packingService.get(id);
        return ResponseEntity.ok(packing);
    }
    
    /**
     * POST /api/warehouse/packing - Create new packing
     */
    @PostMapping
    public ResponseEntity<PackingDto> create(@RequestBody PackingPayload payload) {
        PackingDto created = packingService.create(payload);
        return ResponseEntity.ok(created);
    }
    
    /**
     * PUT /api/warehouse/packing/{id} - Update packing
     */
    @PutMapping("/{id}")
    public ResponseEntity<PackingDto> update(@PathVariable String id, @RequestBody PackingPayload payload) {
        PackingDto updated = packingService.update(id, payload);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * DELETE /api/warehouse/packing/{id} - Delete packing
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        packingService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * POST /api/warehouse/packing/bulk-delete - Delete multiple packings
     */
    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> deleteBulk(@RequestBody List<String> ids) {
        packingService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * GET /api/warehouse/packing/search - Search packings
     */
    @GetMapping("/search")
    public ResponseEntity<List<PackingDto>> search(@RequestParam String q) {
        List<PackingDto> packings = packingService.search(q);
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/warehouse/{warehouseId} - Get packings by warehouse
     */
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<PackingDto>> getByWarehouse(@PathVariable String warehouseId) {
        List<PackingDto> packings = packingService.getByWarehouse(parseUUID(warehouseId));
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/location/{locationId} - Get packings by location
     */
    @GetMapping("/location/{locationId}")
    public ResponseEntity<List<PackingDto>> getByLocation(@PathVariable String locationId) {
        List<PackingDto> packings = packingService.getByLocation(parseUUID(locationId));
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/item/{itemId} - Get packings by item
     */
    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<PackingDto>> getByItem(@PathVariable String itemId) {
        List<PackingDto> packings = packingService.getByItem(parseUUID(itemId));
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/batch/{batchId} - Get packings by batch
     */
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<List<PackingDto>> getByBatch(@PathVariable String batchId) {
        List<PackingDto> packings = packingService.getByBatch(parseUUID(batchId));
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/serial/{serialId} - Get packings by serial
     */
    @GetMapping("/serial/{serialId}")
    public ResponseEntity<List<PackingDto>> getBySerial(@PathVariable String serialId) {
        List<PackingDto> packings = packingService.getBySerial(parseUUID(serialId));
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/shipment/{shipmentId} - Get packings by shipment
     */
    @GetMapping("/shipment/{shipmentId}")
    public ResponseEntity<List<PackingDto>> getByShipment(@PathVariable String shipmentId) {
        List<PackingDto> packings = packingService.getByShipment(parseUUID(shipmentId));
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/pick-list/{pickListId} - Get packings by pick list
     */
    @GetMapping("/pick-list/{pickListId}")
    public ResponseEntity<List<PackingDto>> getByPickList(@PathVariable String pickListId) {
        List<PackingDto> packings = packingService.getByPickList(parseUUID(pickListId));
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/work-order/{workOrder} - Get packings by work order
     */
    @GetMapping("/work-order/{workOrder}")
    public ResponseEntity<List<PackingDto>> getByWorkOrder(@PathVariable String workOrder) {
        List<PackingDto> packings = packingService.getByWorkOrder(workOrder);
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/status/{status} - Get packings by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PackingDto>> getByStatus(@PathVariable String status) {
        List<PackingDto> packings = packingService.getByStatus(parsePackingStatus(status));
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/priority/{priority} - Get packings by priority
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<PackingDto>> getByPriority(@PathVariable String priority) {
        List<PackingDto> packings = packingService.getByPriority(parsePriority(priority));
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/type/{packingType} - Get packings by type
     */
    @GetMapping("/type/{packingType}")
    public ResponseEntity<List<PackingDto>> getByType(@PathVariable String packingType) {
        List<PackingDto> packings = packingService.getByType(parsePackingType(packingType));
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/carton-type/{cartonType} - Get packings by carton type
     */
    @GetMapping("/carton-type/{cartonType}")
    public ResponseEntity<List<PackingDto>> getByCartonType(@PathVariable String cartonType) {
        List<PackingDto> packings = packingService.getByCartonType(cartonType);
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/unpacked - Get packings with unpacked quantity
     */
    @GetMapping("/unpacked")
    public ResponseEntity<List<PackingDto>> getWithUnpackedQuantity() {
        List<PackingDto> packings = packingService.getWithUnpackedQuantity();
        return ResponseEntity.ok(packings);
    }
    
    /**
     * GET /api/warehouse/packing/unconfirmed - Get packings with unconfirmed quantity
     */
    @GetMapping("/unconfirmed")
    public ResponseEntity<List<PackingDto>> getWithUnconfirmedQuantity() {
        List<PackingDto> packings = packingService.getWithUnconfirmedQuantity();
        return ResponseEntity.ok(packings);
    }
    
    /**
     * PUT /api/warehouse/packing/{id}/status - Update packing status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<PackingDto> updateStatus(@PathVariable String id, @RequestParam String status) {
        PackingDto updated = packingService.updateStatus(id, parsePackingStatus(status));
        return ResponseEntity.ok(updated);
    }
    
    /**
     * PUT /api/warehouse/packing/{id}/quantities - Update packing quantities
     */
    @PutMapping("/{id}/quantities")
    public ResponseEntity<PackingDto> updateQuantities(
            @PathVariable String id,
            @RequestParam(required = false) String quantityPacked,
            @RequestParam(required = false) String quantityConfirmed) {
        
        PackingDto updated = packingService.updateQuantities(
            id,
            parseBigDecimal(quantityPacked),
            parseBigDecimal(quantityConfirmed)
        );
        return ResponseEntity.ok(updated);
    }
    
    /**
     * PUT /api/warehouse/packing/{id}/assign - Assign packer to packing
     */
    @PutMapping("/{id}/assign")
    public ResponseEntity<PackingDto> assignPacker(@PathVariable String id, @RequestParam String packer) {
        PackingDto updated = packingService.assignPacker(id, packer);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * PUT /api/warehouse/packing/{id}/pack - Mark packing as packed
     */
    @PutMapping("/{id}/pack")
    public ResponseEntity<PackingDto> markAsPacked(
            @PathVariable String id,
            @RequestParam String packer,
            @RequestParam(required = false) String quantityPacked) {
        
        PackingDto updated = packingService.markAsPacked(
            id,
            packer,
            parseBigDecimal(quantityPacked)
        );
        return ResponseEntity.ok(updated);
    }
    
    /**
     * PUT /api/warehouse/packing/{id}/confirm - Confirm packing
     */
    @PutMapping("/{id}/confirm")
    public ResponseEntity<PackingDto> confirm(
            @PathVariable String id,
            @RequestParam String confirmer,
            @RequestParam(required = false) String quantityConfirmed) {
        
        PackingDto updated = packingService.confirm(
            id,
            confirmer,
            parseBigDecimal(quantityConfirmed)
        );
        return ResponseEntity.ok(updated);
    }
    
    /**
     * GET /api/warehouse/packing/stats - Get packing statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = packingService.getStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * GET /api/warehouse/packing/export/csv - Export packings to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(@RequestParam(required = false) String q) {
        List<PackingDto> packings = packingService.search(q != null ? q : "");
        String csv = packingService.exportCsv(packings);
        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .header("Content-Disposition", "attachment; filename=packings.csv")
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
    
    private com.pcbxpress.erp.modules.warehouse.packing.model.Packing.PackingStatus parsePackingStatus(String statusStr) {
        if (statusStr == null || statusStr.trim().isEmpty()) {
            return null;
        }
        try {
            return com.pcbxpress.erp.modules.warehouse.packing.model.Packing.PackingStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
    
    private com.pcbxpress.erp.modules.warehouse.packing.model.Packing.Priority parsePriority(String priorityStr) {
        if (priorityStr == null || priorityStr.trim().isEmpty()) {
            return null;
        }
        try {
            return com.pcbxpress.erp.modules.warehouse.packing.model.Packing.Priority.valueOf(priorityStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
    
    private com.pcbxpress.erp.modules.warehouse.packing.model.Packing.PackingType parsePackingType(String typeStr) {
        if (typeStr == null || typeStr.trim().isEmpty()) {
            return null;
        }
        try {
            return com.pcbxpress.erp.modules.warehouse.packing.model.Packing.PackingType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
    
    private java.math.BigDecimal parseBigDecimal(String valueStr) {
        if (valueStr == null || valueStr.trim().isEmpty()) {
            return null;
        }
        try {
            return new java.math.BigDecimal(valueStr);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}