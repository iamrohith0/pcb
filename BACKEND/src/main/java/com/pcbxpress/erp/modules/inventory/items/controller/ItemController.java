package com.pcbxpress.erp.modules.inventory.items.controller;

import com.pcbxpress.erp.modules.inventory.items.dto.ItemDto;
import com.pcbxpress.erp.modules.inventory.items.dto.ItemPayload;
import com.pcbxpress.erp.modules.inventory.items.model.Item;
import com.pcbxpress.erp.modules.inventory.items.service.ItemService;
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
 * REST Controller for Inventory Items
 */
@RestController
@RequestMapping("/api/inventory/items")
public class ItemController {
    
    private final ItemService itemService;
    
    public ItemController(ItemService itemService) {
        this.itemService = itemService;
    }
    
    /**
     * List items with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String category = params.get("category");
        String itemTypeStr = params.get("itemType");
        String activeStr = params.get("active");
        
        Item.ItemType itemType = itemTypeStr != null ? Item.ItemType.valueOf(itemTypeStr.toUpperCase()) : null;
        Boolean isActive = activeStr != null ? Boolean.parseBoolean(activeStr) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<ItemDto> filtered = itemService.list(query, category, itemType, isActive);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<ItemDto> items = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single item by ID
     */
    @GetMapping("/{id}")
    public ItemDto get(@PathVariable String id) {
        return itemService.get(id);
    }
    
    /**
     * Create a new item
     */
    @PostMapping
    public ResponseEntity<ItemDto> create(@RequestBody ItemPayload payload) {
        ItemDto created = itemService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing item
     */
    @PutMapping("/{id}")
    public ItemDto update(@PathVariable String id, @RequestBody ItemPayload payload) {
        return itemService.update(id, payload);
    }
    
    /**
     * Delete an item
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        itemService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete items
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        itemService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search items
     */
    @GetMapping("/search")
    public List<ItemDto> search(@RequestParam String q) {
        return itemService.search(q);
    }
    
    /**
     * Get items needing reorder
     */
    @GetMapping("/reorder")
    public List<ItemDto> findItemsNeedingReorder() {
        return itemService.findItemsNeedingReorder();
    }
    
    /**
     * Get items with low stock
     */
    @GetMapping("/low-stock")
    public List<ItemDto> findItemsWithLowStock() {
        return itemService.findItemsWithLowStock();
    }
    
    /**
     * Get items with high stock
     */
    @GetMapping("/high-stock")
    public List<ItemDto> findItemsWithHighStock() {
        return itemService.findItemsWithHighStock();
    }
    
    /**
     * Export items to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<ItemDto> data = itemService.list(params.get("q"), params.get("category"), 
            params.get("itemType") != null ? Item.ItemType.valueOf(params.get("itemType").toUpperCase()) : null,
            params.get("active") != null ? Boolean.parseBoolean(params.get("active")) : null);
        String csv = itemService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=items.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get item statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return itemService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}