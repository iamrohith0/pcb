package com.pcbxpress.erp.modules.production.controller;

import com.pcbxpress.erp.modules.production.dto.WIPEventDto;
import com.pcbxpress.erp.modules.production.dto.WIPEventPayload;
import com.pcbxpress.erp.modules.production.model.WIPEvent;
import com.pcbxpress.erp.modules.production.service.WIPEventService;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
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
 * REST Controller for WIP Events
 */
@RestController
@RequestMapping("/api/production/wip-events")
public class WIPEventController {
    
    private final WIPEventService wipEventService;
    
    public WIPEventController(WIPEventService wipEventService) {
        this.wipEventService = wipEventService;
    }
    
    /**
     * List WIP events with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String workOrderId = params.get("workOrderId");
        String operationId = params.get("operationId");
        String eventTypeStr = params.get("eventType");
        String statusStr = params.get("status");
        String batchId = params.get("batchId");
        String machineName = params.get("machineName");
        String operatorName = params.get("operatorName");
        
        WIPEvent.EventType eventType = eventTypeStr != null ? WIPEvent.EventType.valueOf(eventTypeStr.toUpperCase()) : null;
        WIPEvent.Status status = statusStr != null ? WIPEvent.Status.valueOf(statusStr.toUpperCase()) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<WIPEventDto> filtered = wipEventService.list(query, workOrderId, operationId, eventType, status, batchId, machineName, operatorName);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<WIPEventDto> items = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single WIP event by ID
     */
    @GetMapping("/{id}")
    public WIPEventDto get(@PathVariable String id) {
        return wipEventService.get(id);
    }
    
    /**
     * Create a new WIP event
     */
    @PostMapping
    public ResponseEntity<WIPEventDto> create(@RequestBody WIPEventPayload payload) {
        WIPEventDto created = wipEventService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing WIP event
     */
    @PutMapping("/{id}")
    public WIPEventDto update(@PathVariable String id, @RequestBody WIPEventPayload payload) {
        return wipEventService.update(id, payload);
    }
    
    /**
     * Delete a WIP event
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        wipEventService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete WIP events
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        wipEventService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search WIP events
     */
    @GetMapping("/search")
    public List<WIPEventDto> search(@RequestParam String q) {
        return wipEventService.search(q);
    }
    
    /**
     * Get WIP events by work order ID
     */
    @GetMapping("/work-order/{workOrderId}")
    public List<WIPEventDto> findByWorkOrder(@PathVariable String workOrderId) {
        return wipEventService.findByWorkOrder(workOrderId);
    }
    
    /**
     * Get WIP events by operation ID
     */
    @GetMapping("/operation/{operationId}")
    public List<WIPEventDto> findByOperation(@PathVariable String operationId) {
        return wipEventService.findByOperation(operationId);
    }
    
    /**
     * Get WIP events by batch ID
     */
    @GetMapping("/batch/{batchId}")
    public List<WIPEventDto> findByBatch(@PathVariable String batchId) {
        return wipEventService.findByBatch(batchId);
    }
    
    /**
     * Get WIP events by machine name
     */
    @GetMapping("/machine/{machineName}")
    public List<WIPEventDto> findByMachine(@PathVariable String machineName) {
        return wipEventService.findByMachine(machineName);
    }
    
    /**
     * Get WIP events by operator name
     */
    @GetMapping("/operator/{operatorName}")
    public List<WIPEventDto> findByOperator(@PathVariable String operatorName) {
        return wipEventService.findByOperator(operatorName);
    }
    
    /**
     * Get WIP events by time range
     */
    @GetMapping("/time-range")
    public List<WIPEventDto> findByTimeRange(@RequestParam String startTime, @RequestParam String endTime) {
        OffsetDateTime start = OffsetDateTime.parse(startTime);
        OffsetDateTime end = OffsetDateTime.parse(endTime);
        return wipEventService.findByTimeRange(start, end);
    }
    
    /**
     * Get WIP events with low yield
     */
    @GetMapping("/low-yield")
    public List<WIPEventDto> findLowYieldEvents() {
        return wipEventService.findLowYieldEvents();
    }
    
    /**
     * Get WIP events with high scrap
     */
    @GetMapping("/high-scrap")
    public List<WIPEventDto> findHighScrapEvents() {
        return wipEventService.findHighScrapEvents();
    }
    
    /**
     * Get WIP events with rework
     */
    @GetMapping("/rework")
    public List<WIPEventDto> findReworkEvents() {
        return wipEventService.findReworkEvents();
    }
    
    /**
     * Export WIP events to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<WIPEventDto> data = wipEventService.list(params.get("q"), 
            params.get("workOrderId"), 
            params.get("operationId"), 
            params.get("eventType") != null ? WIPEvent.EventType.valueOf(params.get("eventType").toUpperCase()) : null,
            params.get("status") != null ? WIPEvent.Status.valueOf(params.get("status").toUpperCase()) : null,
            params.get("batchId"), 
            params.get("machineName"), 
            params.get("operatorName"));
        String csv = wipEventService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=wip-events.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get WIP event statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return wipEventService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}