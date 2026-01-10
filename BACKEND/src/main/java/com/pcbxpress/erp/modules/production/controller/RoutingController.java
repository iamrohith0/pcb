package com.pcbxpress.erp.modules.production.controller;

import com.pcbxpress.erp.modules.production.dto.RoutingDto;
import com.pcbxpress.erp.modules.production.dto.RoutingPayload;
import com.pcbxpress.erp.modules.production.model.Routing;
import com.pcbxpress.erp.modules.production.service.RoutingService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
 * REST Controller for Routings
 */
@RestController
@RequestMapping("/api/production/routings")
public class RoutingController {
    
    private final RoutingService routingService;
    
    public RoutingController(RoutingService routingService) {
        this.routingService = routingService;
    }
    
    /**
     * List routings with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String itemCode = params.get("itemCode");
        String statusStr = params.get("status");
        String activeStr = params.get("active");
        String defaultStr = params.get("default");
        
        Routing.RoutingStatus status = statusStr != null ? Routing.RoutingStatus.valueOf(statusStr.toUpperCase()) : null;
        Boolean isActive = activeStr != null ? Boolean.parseBoolean(activeStr) : null;
        Boolean isDefault = defaultStr != null ? Boolean.parseBoolean(defaultStr) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<RoutingDto> filtered = routingService.list(query, itemCode, status, isActive, isDefault);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<RoutingDto> items = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single routing by ID
     */
    @GetMapping("/{id}")
    public RoutingDto get(@PathVariable String id) {
        return routingService.get(id);
    }
    
    /**
     * Create a new routing
     */
    @PostMapping
    public ResponseEntity<RoutingDto> create(@RequestBody RoutingPayload payload) {
        RoutingDto created = routingService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing routing
     */
    @PutMapping("/{id}")
    public RoutingDto update(@PathVariable String id, @RequestBody RoutingPayload payload) {
        return routingService.update(id, payload);
    }
    
    /**
     * Delete a routing
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        routingService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete routings
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        routingService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search routings
     */
    @GetMapping("/search")
    public List<RoutingDto> search(@RequestParam String q) {
        return routingService.search(q);
    }
    
    /**
     * Get latest version of routing for an item
     */
    @GetMapping("/latest/{itemCode}")
    public List<RoutingDto> findLatestVersionByItemCode(@PathVariable String itemCode) {
        return routingService.findLatestVersionByItemCode(itemCode);
    }
    
    /**
     * Get default routing for an item
     */
    @GetMapping("/default/{itemCode}")
    public List<RoutingDto> findDefaultByItemCode(@PathVariable String itemCode) {
        return routingService.findDefaultByItemCode(itemCode);
    }
    
    /**
     * Get active routings
     */
    @GetMapping("/active")
    public List<RoutingDto> findActive() {
        return routingService.findActive();
    }
    
    /**
     * Get default routings
     */
    @GetMapping("/default")
    public List<RoutingDto> findDefault() {
        return routingService.findDefault();
    }
    
    /**
     * Export routings to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<RoutingDto> data = routingService.list(params.get("q"), 
            params.get("itemCode"), 
            params.get("status") != null ? Routing.RoutingStatus.valueOf(params.get("status").toUpperCase()) : null,
            params.get("active") != null ? Boolean.parseBoolean(params.get("active")) : null,
            params.get("default") != null ? Boolean.parseBoolean(params.get("default")) : null);
        String csv = routingService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=routings.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get routing statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return routingService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}