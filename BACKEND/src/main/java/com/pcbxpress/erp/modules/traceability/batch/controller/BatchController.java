package com.pcbxpress.erp.modules.traceability.batch.controller;

import com.pcbxpress.erp.modules.traceability.batch.dto.BatchDto;
import com.pcbxpress.erp.modules.traceability.batch.dto.BatchPayload;
import com.pcbxpress.erp.modules.traceability.batch.model.Batch;
import com.pcbxpress.erp.modules.traceability.batch.service.BatchService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
 * REST Controller for Batch Management
 */
@RestController
@RequestMapping("/api/traceability/batch")
public class BatchController {
    
    private final BatchService batchService;
    
    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }
    
    /**
     * List batches with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String itemId = params.get("itemId");
        String statusStr = params.get("status");
        String activeStr = params.get("active");
        
        Batch.BatchStatus status = statusStr != null ? Batch.BatchStatus.valueOf(statusStr.toUpperCase()) : null;
        Boolean isActive = activeStr != null ? Boolean.parseBoolean(activeStr) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<BatchDto> filtered = batchService.list(query, itemId, status, isActive, page, size);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<BatchDto> batches = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "batches", batches,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single batch by ID
     */
    @GetMapping("/{id}")
    public BatchDto get(@PathVariable String id) {
        return batchService.get(id);
    }
    
    /**
     * Create a new batch
     */
    @PostMapping
    public ResponseEntity<BatchDto> create(@RequestBody BatchPayload payload) {
        BatchDto created = batchService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing batch
     */
    @PutMapping("/{id}")
    public BatchDto update(@PathVariable String id, @RequestBody BatchPayload payload) {
        return batchService.update(id, payload);
    }
    
    /**
     * Delete a batch
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        batchService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete batches
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        batchService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search batches
     */
    @GetMapping("/search")
    public List<BatchDto> search(@RequestParam String q) {
        return batchService.search(q);
    }
    
    /**
     * Register a new batch
     */
    @PostMapping("/register")
    public ResponseEntity<BatchDto> registerBatch(@RequestBody BatchPayload payload) {
        BatchDto registered = batchService.registerBatch(payload);
        return ResponseEntity.status(201).body(registered);
    }
    
    /**
     * Get batch history
     */
    @GetMapping("/{id}/history")
    public List<BatchDto> getBatchHistory(@PathVariable String id) {
        return batchService.getBatchHistory(id);
    }
    
    /**
     * Get batch traceability information
     */
    @GetMapping("/{id}/traceability")
    public Map<String, Object> getBatchTraceability(@PathVariable String id) {
        return batchService.getBatchTraceability(id);
    }
    
    /**
     * Scan batch
     */
    @PostMapping("/scan")
    public BatchDto scanBatch(@RequestBody Map<String, String> scanData) {
        String batchNumber = scanData.get("batchNumber");
        String location = scanData.get("location");
        String notes = scanData.get("notes");
        
        return batchService.scanBatch(batchNumber, location, notes);
    }
    
    /**
     * Get batches by item
     */
    @GetMapping("/item/{itemId}")
    public List<BatchDto> getByItem(@PathVariable String itemId) {
        return batchService.getByItem(itemId);
    }
    
    /**
     * Get batches by status
     */
    @GetMapping("/status/{status}")
    public List<BatchDto> getByStatus(@PathVariable String status) {
        Batch.BatchStatus batchStatus = Batch.BatchStatus.valueOf(status.toUpperCase());
        return batchService.getByStatus(batchStatus);
    }
    
    /**
     * Get expired batches
     */
    @GetMapping("/expired")
    public List<BatchDto> getExpiredBatches() {
        return batchService.getExpiredBatches();
    }
    
    /**
     * Get batches needing reorder
     */
    @GetMapping("/reorder")
    public List<BatchDto> getBatchesNeedingReorder(@RequestParam(required = false) Integer threshold) {
        return batchService.getBatchesNeedingReorder(threshold);
    }
    
    /**
     * Export batches to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<BatchDto> data = batchService.list(params.get("q"), params.get("itemId"), 
            params.get("status") != null ? Batch.BatchStatus.valueOf(params.get("status").toUpperCase()) : null,
            params.get("active") != null ? Boolean.parseBoolean(params.get("active")) : null,
            parseInt(params.get("page"), 1), parseInt(params.getOrDefault("size", params.get("limit")), 20));
        String csv = exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=batches.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get batch statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return batchService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
    
    private static String exportCsv(List<BatchDto> data) {
        String header = "Batch Number,Item ID,Production Date,Expiry Date,Quantity,Status,Location,Warehouse ID,Supplier ID,Lot Number,Active";
        String rows = data.stream()
            .map(batch -> String.join(",",
                safe(batch.batchNumber()),
                safe(batch.itemId()),
                safe(batch.productionDate() != null ? batch.productionDate().toString() : ""),
                safe(batch.expiryDate() != null ? batch.expiryDate().toString() : ""),
                safe(batch.quantity() != null ? batch.quantity().toString() : ""),
                safe(batch.status() != null ? batch.status().toString() : ""),
                safe(batch.location()),
                safe(batch.warehouseId()),
                safe(batch.supplierId()),
                safe(batch.lotNumber()),
                batch.isActive() ? "Yes" : "No"
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
}