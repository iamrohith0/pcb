package com.pcbxpress.erp.modules.production.controller;

import com.pcbxpress.erp.modules.production.dto.OperationDto;
import com.pcbxpress.erp.modules.production.dto.OperationPayload;
import com.pcbxpress.erp.modules.production.model.Operation;
import com.pcbxpress.erp.modules.production.service.OperationService;
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
 * REST Controller for Operations
 */
@RestController
@RequestMapping("/api/production/operations")
public class OperationController {
    
    private final OperationService operationService;
    
    public OperationController(OperationService operationService) {
        this.operationService = operationService;
    }
    
    /**
     * List operations with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String routingId = params.get("routingId");
        String operationTypeStr = params.get("operationType");
        String machineType = params.get("machineType");
        String criticalStr = params.get("critical");
        String inspectionStr = params.get("inspection");
        
        Operation.OperationType operationType = operationTypeStr != null ? Operation.OperationType.valueOf(operationTypeStr.toUpperCase()) : null;
        Boolean isCritical = criticalStr != null ? Boolean.parseBoolean(criticalStr) : null;
        Boolean isInspection = inspectionStr != null ? Boolean.parseBoolean(inspectionStr) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<OperationDto> filtered = operationService.list(query, routingId, operationType, machineType, isCritical, isInspection);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<OperationDto> items = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single operation by ID
     */
    @GetMapping("/{id}")
    public OperationDto get(@PathVariable String id) {
        return operationService.get(id);
    }
    
    /**
     * Create a new operation
     */
    @PostMapping
    public ResponseEntity<OperationDto> create(@RequestBody OperationPayload payload) {
        OperationDto created = operationService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing operation
     */
    @PutMapping("/{id}")
    public OperationDto update(@PathVariable String id, @RequestBody OperationPayload payload) {
        return operationService.update(id, payload);
    }
    
    /**
     * Delete an operation
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        operationService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete operations
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        operationService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search operations
     */
    @GetMapping("/search")
    public List<OperationDto> search(@RequestParam String q) {
        return operationService.search(q);
    }
    
    /**
     * Get operations by routing ID ordered by sequence
     */
    @GetMapping("/routing/{routingId}/ordered")
    public List<OperationDto> findByRoutingIdOrdered(@PathVariable String routingId) {
        return operationService.findByRoutingIdOrdered(routingId);
    }
    
    /**
     * Get operations by machine type
     */
    @GetMapping("/machine-type/{machineType}")
    public List<OperationDto> findByMachineType(@PathVariable String machineType) {
        return operationService.findByMachineType(machineType);
    }
    
    /**
     * Get critical operations
     */
    @GetMapping("/critical")
    public List<OperationDto> findCritical() {
        return operationService.findCritical();
    }
    
    /**
     * Get inspection operations
     */
    @GetMapping("/inspection")
    public List<OperationDto> findInspection() {
        return operationService.findInspection();
    }
    
    /**
     * Get operations requiring tooling
     */
    @GetMapping("/requiring-tooling")
    public List<OperationDto> findRequiringTooling() {
        return operationService.findRequiringTooling();
    }
    
    /**
     * Export operations to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<OperationDto> data = operationService.list(params.get("q"), 
            params.get("routingId"), 
            params.get("operationType") != null ? Operation.OperationType.valueOf(params.get("operationType").toUpperCase()) : null,
            params.get("machineType"), 
            params.get("critical") != null ? Boolean.parseBoolean(params.get("critical")) : null,
            params.get("inspection") != null ? Boolean.parseBoolean(params.get("inspection")) : null);
        String csv = operationService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=operations.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get operation statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return operationService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}