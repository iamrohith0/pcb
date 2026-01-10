package com.pcbxpress.erp.modules.inventory.adjustments.controller;

import com.pcbxpress.erp.modules.inventory.adjustments.dto.AdjustmentDto;
import com.pcbxpress.erp.modules.inventory.adjustments.dto.AdjustmentPayload;
import com.pcbxpress.erp.modules.inventory.adjustments.service.AdjustmentService;
import java.util.List;
import java.util.Map;
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
 * REST Controller for Adjustment Management
 */
@RestController
@RequestMapping("/api/inventory/adjustments")
public class AdjustmentController {
    
    private final AdjustmentService adjustmentService;
    
    public AdjustmentController(AdjustmentService adjustmentService) {
        this.adjustmentService = adjustmentService;
    }
    
    /**
     * List adjustments with optional filters
     */
    @GetMapping
    public List<AdjustmentDto> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String status = params.get("status");
        String type = params.get("type");
        String itemId = params.get("itemId");
        String warehouseId = params.get("warehouseId");
        
        return adjustmentService.list(query, status, type, itemId, warehouseId);
    }
    
    /**
     * Get a single adjustment by ID
     */
    @GetMapping("/{id}")
    public AdjustmentDto get(@PathVariable String id) {
        return adjustmentService.get(id);
    }
    
    /**
     * Create a new adjustment
     */
    @PostMapping
    public AdjustmentDto create(@RequestBody AdjustmentPayload payload) {
        return adjustmentService.create(payload);
    }
    
    /**
     * Update an existing adjustment
     */
    @PutMapping("/{id}")
    public AdjustmentDto update(@PathVariable String id, @RequestBody AdjustmentPayload payload) {
        return adjustmentService.update(id, payload);
    }
    
    /**
     * Delete an adjustment
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        adjustmentService.delete(id);
    }
    
    /**
     * Approve an adjustment
     */
    @PutMapping("/{id}/approve")
    public AdjustmentDto approve(@PathVariable String id, @RequestBody Map<String, String> request) {
        String approvedBy = request.get("approvedBy");
        return adjustmentService.approve(id, approvedBy);
    }
    
    /**
     * Reject an adjustment
     */
    @PutMapping("/{id}/reject")
    public AdjustmentDto reject(@PathVariable String id, @RequestBody Map<String, String> request) {
        String rejectedBy = request.get("rejectedBy");
        String reason = request.get("reason");
        return adjustmentService.reject(id, rejectedBy, reason);
    }
    
    /**
     * Search adjustments
     */
    @GetMapping("/search")
    public List<AdjustmentDto> search(@RequestParam String q) {
        return adjustmentService.search(q);
    }
    
    /**
     * Get adjustments by item
     */
    @GetMapping("/items/{itemId}")
    public List<AdjustmentDto> getByItem(@PathVariable String itemId, 
                                        @RequestParam(defaultValue = "100") int limit) {
        return adjustmentService.getByItem(itemId, limit);
    }
    
    /**
     * Get adjustments by warehouse
     */
    @GetMapping("/warehouses/{warehouseId}")
    public List<AdjustmentDto> getByWarehouse(@PathVariable String warehouseId, 
                                            @RequestParam(defaultValue = "100") int limit) {
        return adjustmentService.getByWarehouse(warehouseId, limit);
    }
    
    /**
     * Get adjustment statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return adjustmentService.getStats();
    }
}