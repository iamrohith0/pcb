package com.pcbxpress.erp.modules.traceability.recall.controller;

import com.pcbxpress.erp.modules.traceability.recall.dto.RecallDto;
import com.pcbxpress.erp.modules.traceability.recall.dto.RecallPayload;
import com.pcbxpress.erp.modules.traceability.recall.model.Recall;
import com.pcbxpress.erp.modules.traceability.recall.service.RecallService;
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
 * REST Controller for Recall Management
 */
@RestController
@RequestMapping("/api/traceability/recall")
public class RecallController {
    
    private final RecallService recallService;
    
    public RecallController(RecallService recallService) {
        this.recallService = recallService;
    }
    
    /**
     * List recalls with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String productId = params.get("productId");
        String batchId = params.get("batchId");
        String lotId = params.get("lotId");
        String recallTypeStr = params.get("recallType");
        String severityStr = params.get("severity");
        String statusStr = params.get("status");
        String activeStr = params.get("active");
        
        Recall.RecallType recallType = recallTypeStr != null ? Recall.RecallType.valueOf(recallTypeStr.toUpperCase()) : null;
        Recall.Severity severity = severityStr != null ? Recall.Severity.valueOf(severityStr.toUpperCase()) : null;
        Recall.RecallStatus status = statusStr != null ? Recall.RecallStatus.valueOf(statusStr.toUpperCase()) : null;
        Boolean isActive = activeStr != null ? Boolean.parseBoolean(activeStr) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<RecallDto> filtered = recallService.list(query, productId, batchId, lotId, 
            recallType, severity, status, isActive, page, size);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<RecallDto> recalls = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "recalls", recalls,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single recall by ID
     */
    @GetMapping("/{id}")
    public RecallDto get(@PathVariable String id) {
        return recallService.get(id);
    }
    
    /**
     * Create a new recall
     */
    @PostMapping
    public ResponseEntity<RecallDto> create(@RequestBody RecallPayload payload) {
        RecallDto created = recallService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing recall
     */
    @PutMapping("/{id}")
    public RecallDto update(@PathVariable String id, @RequestBody RecallPayload payload) {
        return recallService.update(id, payload);
    }
    
    /**
     * Delete a recall
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        recallService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete recalls
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        recallService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search recalls
     */
    @GetMapping("/search")
    public List<RecallDto> search(@RequestParam String q) {
        return recallService.search(q);
    }
    
    /**
     * Initiate a recall
     */
    @PostMapping("/initiate")
    public ResponseEntity<RecallDto> initiateRecall(@RequestBody RecallPayload payload) {
        RecallDto initiated = recallService.initiateRecall(payload);
        return ResponseEntity.status(201).body(initiated);
    }
    
    /**
     * Get recall impact analysis
     */
    @GetMapping("/{id}/impact")
    public Map<String, Object> getRecallImpact(@PathVariable String id) {
        return recallService.getRecallImpact(id);
    }
    
    /**
     * Get recall cases
     */
    @GetMapping("/cases")
    public List<RecallDto> getRecallCases(@RequestParam(required = false) String recallType,
                                        @RequestParam(required = false) String severity,
                                        @RequestParam(required = false) String status) {
        return recallService.getRecallCases(recallType, severity, status);
    }
    
    /**
     * Get recall reports
     */
    @GetMapping("/reports")
    public Map<String, Object> getRecallReports(@RequestParam(required = false) String dateRange,
                                              @RequestParam(required = false) String severity,
                                              @RequestParam(required = false) String status) {
        return recallService.getRecallReports(dateRange, severity, status);
    }
    
    /**
     * Update recall status
     */
    @PutMapping("/{id}/status")
    public RecallDto updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        String statusStr = request.get("status");
        Recall.RecallStatus status = statusStr != null ? Recall.RecallStatus.valueOf(statusStr.toUpperCase()) : null;
        return recallService.updateStatus(id, status);
    }
    
    /**
     * Export recalls to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<RecallDto> data = recallService.list(params.get("q"), params.get("productId"), 
            params.get("batchId"), params.get("lotId"), 
            params.get("recallType") != null ? Recall.RecallType.valueOf(params.get("recallType").toUpperCase()) : null,
            params.get("severity") != null ? Recall.Severity.valueOf(params.get("severity").toUpperCase()) : null,
            params.get("status") != null ? Recall.RecallStatus.valueOf(params.get("status").toUpperCase()) : null,
            params.get("active") != null ? Boolean.parseBoolean(params.get("active")) : null,
            parseInt(params.get("page"), 1), parseInt(params.getOrDefault("size", params.get("limit")), 20));
        String csv = exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=recalls.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get recall statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return recallService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
    
    private static String exportCsv(List<RecallDto> data) {
        String header = "Case Number,Product ID,Batch ID,Lot ID,Recall Type,Severity,Status,Reason,Affected Quantity,Estimated Cost,Actual Cost,Initiated Date,Effective Date,Customer Notification Required,Regulatory Notification Required";
        String rows = data.stream()
            .map(recall -> String.join(",",
                safe(recall.caseNumber()),
                safe(recall.productId()),
                safe(recall.batchId()),
                safe(recall.lotId()),
                safe(recall.recallType() != null ? recall.recallType().toString() : ""),
                safe(recall.severity() != null ? recall.severity().toString() : ""),
                safe(recall.status() != null ? recall.status().toString() : ""),
                safe(recall.reason()),
                safe(recall.affectedQuantity() != null ? recall.affectedQuantity().toString() : ""),
                safe(recall.estimatedCost() != null ? recall.estimatedCost().toString() : ""),
                safe(recall.actualCost() != null ? recall.actualCost().toString() : ""),
                safe(recall.initiatedDate() != null ? recall.initiatedDate().toString() : ""),
                safe(recall.effectiveDate() != null ? recall.effectiveDate().toString() : ""),
                recall.customerNotificationRequired() ? "Yes" : "No",
                recall.regulatoryNotificationRequired() ? "Yes" : "No"
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
}