package com.pcbxpress.erp.modules.inventory.lots.controller;

import com.pcbxpress.erp.modules.inventory.lots.dto.LotDto;
import com.pcbxpress.erp.modules.inventory.lots.dto.LotPayload;
import com.pcbxpress.erp.modules.inventory.lots.service.LotService;
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
 * REST Controller for Lot Management
 */
@RestController
@RequestMapping("/api/inventory/lots")
public class LotController {
    
    private final LotService lotService;
    
    public LotController(LotService lotService) {
        this.lotService = lotService;
    }
    
    /**
     * List lots with optional filters
     */
    @GetMapping
    public List<LotDto> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String status = params.get("status");
        String qualityStatus = params.get("qualityStatus");
        String itemId = params.get("itemId");
        
        return lotService.list(query, status, qualityStatus, itemId);
    }
    
    /**
     * Get a single lot by ID
     */
    @GetMapping("/{id}")
    public LotDto getById(@PathVariable String id) {
        return lotService.getById(id);
    }
    
    /**
     * Create a new lot
     */
    @PostMapping
    public LotDto create(@RequestBody LotPayload payload) {
        return lotService.create(payload);
    }
    
    /**
     * Update an existing lot
     */
    @PutMapping("/{id}")
    public LotDto update(@PathVariable String id, @RequestBody LotPayload payload) {
        return lotService.update(id, payload);
    }
    
    /**
     * Delete a lot
     */
    @DeleteMapping("/{id}")
    public void remove(@PathVariable String id) {
        lotService.remove(id);
    }
    
    /**
     * Update lot status
     */
    @PutMapping("/{id}/status")
    public LotDto updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        String status = request.get("status");
        return lotService.updateStatus(id, status);
    }
    
    /**
     * Get lot movements
     */
    @GetMapping("/{id}/movements")
    public List<Object[]> getMovements(@PathVariable String id, 
                                      @RequestParam(defaultValue = "30") int days) {
        return lotService.getMovements(id, days);
    }
    
    /**
     * Get lot genealogy
     */
    @GetMapping("/{id}/genealogy")
    public Map<String, Object> getGenealogy(@PathVariable String id) {
        return lotService.getGenealogy(id);
    }
    
    /**
     * Search lots
     */
    @GetMapping("/search")
    public List<LotDto> search(@RequestParam String q) {
        return lotService.search(q);
    }
    
    /**
     * Get expiring lots
     */
    @GetMapping("/expiring")
    public List<LotDto> getExpiringLots(@RequestParam(defaultValue = "30") int days) {
        return lotService.getExpiringLots(days);
    }
    
    /**
     * Get lot statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return lotService.getStats();
    }
}