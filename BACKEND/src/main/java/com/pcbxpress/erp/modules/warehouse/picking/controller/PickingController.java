package com.pcbxpress.erp.modules.warehouse.picking.controller;

import com.pcbxpress.erp.modules.warehouse.picking.dto.PickingDto;
import com.pcbxpress.erp.modules.warehouse.picking.dto.PickingPayload;
import com.pcbxpress.erp.modules.warehouse.picking.service.PickingService;
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
 * REST Controller for Picking management
 */
@RestController
@RequestMapping("/api/warehouse/picking")
public class PickingController {
    
    private final PickingService pickingService;
    
    public PickingController(PickingService pickingService) {
        this.pickingService = pickingService;
    }
    
    /**
     * GET /api/warehouse/picking - List pickings with optional filters
     */
    @GetMapping
    public ResponseEntity<List<PickingDto>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String warehouseId,
            @RequestParam(required = false) String locationId,
            @RequestParam(required = false) String itemId,
            @RequestParam(required = false) String batchId,
            @RequestParam(required = false) String serialId,
            @RequestParam(required = false) String shipmentId,
            @RequestParam(required = false) String workOrder,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String pickingType) {
        
        List<PickingDto> pickings = pickingService.list(
            q,
            parseUUID(warehouseId),
            parseUUID(locationId),
            parseUUID(itemId),
            parseUUID(batchId),
            parseUUID(serialId),
            parseUUID(shipmentId),
            workOrder,
            parsePickingStatus(status),
            parsePriority(priority),
            parsePickingType(pickingType)
        );
        
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/{id} - Get picking by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<PickingDto> get(@PathVariable String id) {
        PickingDto picking = pickingService.get(id);
        return ResponseEntity.ok(picking);
    }
    
    /**
     * POST /api/warehouse/picking - Create new picking
     */
    @PostMapping
    public ResponseEntity<PickingDto> create(@RequestBody PickingPayload payload) {
        PickingDto created = pickingService.create(payload);
        return ResponseEntity.ok(created);
    }
    
    /**
     * PUT /api/warehouse/picking/{id} - Update picking
     */
    @PutMapping("/{id}")
    public ResponseEntity<PickingDto> update(@PathVariable String id, @RequestBody PickingPayload payload) {
        PickingDto updated = pickingService.update(id, payload);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * DELETE /api/warehouse/picking/{id} - Delete picking
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        pickingService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * POST /api/warehouse/picking/bulk-delete - Delete multiple pickings
     */
    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> deleteBulk(@RequestBody List<String> ids) {
        pickingService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * GET /api/warehouse/picking/search - Search pickings
     */
    @GetMapping("/search")
    public ResponseEntity<List<PickingDto>> search(@RequestParam String q) {
        List<PickingDto> pickings = pickingService.search(q);
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/warehouse/{warehouseId} - Get pickings by warehouse
     */
    @GetMapping("/warehouse/{warehouseId}")
    public ResponseEntity<List<PickingDto>> getByWarehouse(@PathVariable String warehouseId) {
        List<PickingDto> pickings = pickingService.getByWarehouse(parseUUID(warehouseId));
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/location/{locationId} - Get pickings by location
     */
    @GetMapping("/location/{locationId}")
    public ResponseEntity<List<PickingDto>> getByLocation(@PathVariable String locationId) {
        List<PickingDto> pickings = pickingService.getByLocation(parseUUID(locationId));
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/item/{itemId} - Get pickings by item
     */
    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<PickingDto>> getByItem(@PathVariable String itemId) {
        List<PickingDto> pickings = pickingService.getByItem(parseUUID(itemId));
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/batch/{batchId} - Get pickings by batch
     */
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<List<PickingDto>> getByBatch(@PathVariable String batchId) {
        List<PickingDto> pickings = pickingService.getByBatch(parseUUID(batchId));
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/serial/{serialId} - Get pickings by serial
     */
    @GetMapping("/serial/{serialId}")
    public ResponseEntity<List<PickingDto>> getBySerial(@PathVariable String serialId) {
        List<PickingDto> pickings = pickingService.getBySerial(parseUUID(serialId));
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/shipment/{shipmentId} - Get pickings by shipment
     */
    @GetMapping("/shipment/{shipmentId}")
    public ResponseEntity<List<PickingDto>> getByShipment(@PathVariable String shipmentId) {
        List<PickingDto> pickings = pickingService.getByShipment(parseUUID(shipmentId));
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/work-order/{workOrder} - Get pickings by work order
     */
    @GetMapping("/work-order/{workOrder}")
    public ResponseEntity<List<PickingDto>> getByWorkOrder(@PathVariable String workOrder) {
        List<PickingDto> pickings = pickingService.getByWorkOrder(workOrder);
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/status/{status} - Get pickings by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PickingDto>> getByStatus(@PathVariable String status) {
        List<PickingDto> pickings = pickingService.getByStatus(parsePickingStatus(status));
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/priority/{priority} - Get pickings by priority
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<PickingDto>> getByPriority(@PathVariable String priority) {
        List<PickingDto> pickings = pickingService.getByPriority(parsePriority(priority));
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/type/{pickingType} - Get pickings by type
     */
    @GetMapping("/type/{pickingType}")
    public ResponseEntity<List<PickingDto>> getByType(@PathVariable String pickingType) {
        List<PickingDto> pickings = pickingService.getByType(parsePickingType(pickingType));
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/unpicked - Get pickings with unpicked quantity
     */
    @GetMapping("/unpicked")
    public ResponseEntity<List<PickingDto>> getWithUnpickedQuantity() {
        List<PickingDto> pickings = pickingService.getWithUnpickedQuantity();
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * GET /api/warehouse/picking/unconfirmed - Get pickings with unconfirmed quantity
     */
    @GetMapping("/unconfirmed")
    public ResponseEntity<List<PickingDto>> getWithUnconfirmedQuantity() {
        List<PickingDto> pickings = pickingService.getWithUnconfirmedQuantity();
        return ResponseEntity.ok(pickings);
    }
    
    /**
     * PUT /api/warehouse/picking/{id}/status - Update picking status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<PickingDto> updateStatus(@PathVariable String id, @RequestParam String status) {
        PickingDto updated = pickingService.updateStatus(id, parsePickingStatus(status));
        return ResponseEntity.ok(updated);
    }
    
    /**
     * PUT /api/warehouse/picking/{id}/quantities - Update picking quantities
     */
    @PutMapping("/{id}/quantities")
    public ResponseEntity<PickingDto> updateQuantities(
            @PathVariable String id,
            @RequestParam(required = false) String quantityPicked,
            @RequestParam(required = false) String quantityConfirmed) {
        
        PickingDto updated = pickingService.updateQuantities(
            id,
            parseBigDecimal(quantityPicked),
            parseBigDecimal(quantityConfirmed)
        );
        return ResponseEntity.ok(updated);
    }
    
    /**
     * PUT /api/warehouse/picking/{id}/assign - Assign picker to picking
     */
    @PutMapping("/{id}/assign")
    public ResponseEntity<PickingDto> assignPicker(@PathVariable String id, @RequestParam String picker) {
        PickingDto updated = pickingService.assignPicker(id, picker);
        return ResponseEntity.ok(updated);
    }
    
    /**
     * PUT /api/warehouse/picking/{id}/pick - Mark picking as picked
     */
    @PutMapping("/{id}/pick")
    public ResponseEntity<PickingDto> markAsPicked(
            @PathVariable String id,
            @RequestParam String picker,
            @RequestParam(required = false) String quantityPicked) {
        
        PickingDto updated = pickingService.markAsPicked(
            id,
            picker,
            parseBigDecimal(quantityPicked)
        );
        return ResponseEntity.ok(updated);
    }
    
    /**
     * PUT /api/warehouse/picking/{id}/confirm - Confirm picking
     */
    @PutMapping("/{id}/confirm")
    public ResponseEntity<PickingDto> confirm(
            @PathVariable String id,
            @RequestParam String confirmer,
            @RequestParam(required = false) String quantityConfirmed) {
        
        PickingDto updated = pickingService.confirm(
            id,
            confirmer,
            parseBigDecimal(quantityConfirmed)
        );
        return ResponseEntity.ok(updated);
    }
    
    /**
     * GET /api/warehouse/picking/stats - Get picking statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = pickingService.getStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * GET /api/warehouse/picking/export/csv - Export pickings to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(@RequestParam(required = false) String q) {
        List<PickingDto> pickings = pickingService.search(q != null ? q : "");
        String csv = pickingService.exportCsv(pickings);
        return ResponseEntity.ok()
            .header("Content-Type", "text/csv")
            .header("Content-Disposition", "attachment; filename=pickings.csv")
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
    
    private com.pcbxpress.erp.modules.warehouse.picking.model.Picking.PickingStatus parsePickingStatus(String statusStr) {
        if (statusStr == null || statusStr.trim().isEmpty()) {
            return null;
        }
        try {
            return com.pcbxpress.erp.modules.warehouse.picking.model.Picking.PickingStatus.valueOf(statusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
    
    private com.pcbxpress.erp.modules.warehouse.picking.model.Picking.Priority parsePriority(String priorityStr) {
        if (priorityStr == null || priorityStr.trim().isEmpty()) {
            return null;
        }
        try {
            return com.pcbxpress.erp.modules.warehouse.picking.model.Picking.Priority.valueOf(priorityStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
    
    private com.pcbxpress.erp.modules.warehouse.picking.model.Picking.PickingType parsePickingType(String typeStr) {
        if (typeStr == null || typeStr.trim().isEmpty()) {
            return null;
        }
        try {
            return com.pcbxpress.erp.modules.warehouse.picking.model.Picking.PickingType.valueOf(typeStr.toUpperCase());
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