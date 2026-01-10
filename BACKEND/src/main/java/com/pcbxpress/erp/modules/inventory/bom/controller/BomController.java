package com.pcbxpress.erp.modules.inventory.bom.controller;

import com.pcbxpress.erp.modules.inventory.bom.dto.BomDto;
import com.pcbxpress.erp.modules.inventory.bom.dto.BomPayload;
import com.pcbxpress.erp.modules.inventory.bom.service.BomService;
import java.time.OffsetDateTime;
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
 * REST Controller for BOM Management
 */
@RestController
@RequestMapping("/api/inventory/boms")
public class BomController {
    
    private final BomService bomService;
    
    public BomController(BomService bomService) {
        this.bomService = bomService;
    }
    
    /**
     * List BOMs with optional filters
     */
    @GetMapping
    public List<BomDto> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String status = params.get("status");
        String revision = params.get("revision");
        String productItemId = params.get("productItemId");
        
        return bomService.list(query, status, revision, productItemId);
    }
    
    /**
     * Get a single BOM by ID
     */
    @GetMapping("/{id}")
    public BomDto get(@PathVariable String id) {
        return bomService.get(id);
    }
    
    /**
     * Create a new BOM
     */
    @PostMapping
    public BomDto create(@RequestBody BomPayload payload) {
        return bomService.create(payload);
    }
    
    /**
     * Update an existing BOM
     */
    @PutMapping("/{id}")
    public BomDto update(@PathVariable String id, @RequestBody BomPayload payload) {
        return bomService.update(id, payload);
    }
    
    /**
     * Delete a BOM
     */
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        bomService.delete(id);
    }
    
    /**
     * Get BOM by product item
     */
    @GetMapping("/product-items/{productItemId}")
    public List<BomDto> getByProductItem(@PathVariable String productItemId, 
                                        @RequestParam(defaultValue = "100") int limit) {
        return bomService.getByProductItem(productItemId, limit);
    }
    
    /**
     * Get active BOMs
     */
    @GetMapping("/active")
    public List<BomDto> getActiveBoms(@RequestParam(defaultValue = "100") int limit) {
        return bomService.getActiveBoms(limit);
    }
    
    /**
     * Get BOMs effective on date
     */
    @GetMapping("/effective")
    public List<BomDto> getBomsEffectiveOnDate(@RequestParam String date, 
                                             @RequestParam(defaultValue = "100") int limit) {
        OffsetDateTime effectiveDate = OffsetDateTime.parse(date);
        return bomService.getBomsEffectiveOnDate(effectiveDate, limit);
    }
    
    /**
     * Get latest BOM for product item
     */
    @GetMapping("/latest/{productItemId}")
    public BomDto getLatestBom(@PathVariable String productItemId) {
        return bomService.getLatestBom(productItemId);
    }
    
    /**
     * Search BOMs
     */
    @GetMapping("/search")
    public List<BomDto> search(@RequestParam String q) {
        return bomService.search(q);
    }
    
    /**
     * Get BOM statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return bomService.getStats();
    }
}