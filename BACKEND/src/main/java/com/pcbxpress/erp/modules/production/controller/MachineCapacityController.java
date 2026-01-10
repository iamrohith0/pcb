package com.pcbxpress.erp.modules.production.controller;

import com.pcbxpress.erp.modules.production.dto.MachineCapacityDto;
import com.pcbxpress.erp.modules.production.dto.MachineCapacityPayload;
import com.pcbxpress.erp.modules.production.model.MachineCapacity;
import com.pcbxpress.erp.modules.production.service.MachineCapacityService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
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
 * REST Controller for Machine Capacity
 */
@RestController
@RequestMapping("/api/production/machine-capacity")
public class MachineCapacityController {
    
    private final MachineCapacityService machineCapacityService;
    
    public MachineCapacityController(MachineCapacityService machineCapacityService) {
        this.machineCapacityService = machineCapacityService;
    }
    
    /**
     * List machine capacities with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String machineId = params.get("machineId");
        String machineType = params.get("machineType");
        String dateStr = params.get("date");
        String shiftStr = params.get("shift");
        String statusStr = params.get("status");
        String workOrderId = params.get("workOrderId");
        String operationId = params.get("operationId");
        
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : null;
        MachineCapacity.Shift shift = shiftStr != null ? MachineCapacity.Shift.valueOf(shiftStr.toUpperCase()) : null;
        MachineCapacity.Status status = statusStr != null ? MachineCapacity.Status.valueOf(statusStr.toUpperCase()) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<MachineCapacityDto> filtered = machineCapacityService.list(query, machineId, machineType, date, shift, status, workOrderId, operationId);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<MachineCapacityDto> items = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single machine capacity by ID
     */
    @GetMapping("/{id}")
    public MachineCapacityDto get(@PathVariable String id) {
        return machineCapacityService.get(id);
    }
    
    /**
     * Create a new machine capacity
     */
    @PostMapping
    public ResponseEntity<MachineCapacityDto> create(@RequestBody MachineCapacityPayload payload) {
        MachineCapacityDto created = machineCapacityService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing machine capacity
     */
    @PutMapping("/{id}")
    public MachineCapacityDto update(@PathVariable String id, @RequestBody MachineCapacityPayload payload) {
        return machineCapacityService.update(id, payload);
    }
    
    /**
     * Delete a machine capacity
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        machineCapacityService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete machine capacities
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        machineCapacityService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search machine capacities
     */
    @GetMapping("/search")
    public List<MachineCapacityDto> search(@RequestParam String q) {
        return machineCapacityService.search(q);
    }
    
    /**
     * Get machine capacity by machine ID and date
     */
    @GetMapping("/machine/{machineId}/date/{date}")
    public List<MachineCapacityDto> findByMachineAndDate(@PathVariable String machineId, @PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        return machineCapacityService.findByMachineAndDate(machineId, localDate);
    }
    
    /**
     * Get machine capacity by date and shift
     */
    @GetMapping("/date/{date}/shift/{shift}")
    public List<MachineCapacityDto> findByDateAndShift(@PathVariable String date, @PathVariable String shift) {
        LocalDate localDate = LocalDate.parse(date);
        MachineCapacity.Shift shiftEnum = MachineCapacity.Shift.valueOf(shift.toUpperCase());
        return machineCapacityService.findByDateAndShift(localDate, shiftEnum);
    }
    
    /**
     * Get machine capacity by machine ID and date range
     */
    @GetMapping("/machine/{machineId}/date-range")
    public List<MachineCapacityDto> findByMachineAndDateRange(@PathVariable String machineId, @RequestParam String startDate, @RequestParam String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return machineCapacityService.findByMachineAndDateRange(machineId, start, end);
    }
    
    /**
     * Get machine capacity by status
     */
    @GetMapping("/status/{status}")
    public List<MachineCapacityDto> findByStatus(@PathVariable String status) {
        MachineCapacity.Status statusEnum = MachineCapacity.Status.valueOf(status.toUpperCase());
        return machineCapacityService.findByStatus(statusEnum);
    }
    
    /**
     * Get machine capacity by work order ID
     */
    @GetMapping("/work-order/{workOrderId}")
    public List<MachineCapacityDto> findByWorkOrder(@PathVariable String workOrderId) {
        return machineCapacityService.findByWorkOrder(workOrderId);
    }
    
    /**
     * Get machine capacity by operation ID
     */
    @GetMapping("/operation/{operationId}")
    public List<MachineCapacityDto> findByOperation(@PathVariable String operationId) {
        return machineCapacityService.findByOperation(operationId);
    }
    
    /**
     * Get machine capacity with high utilization
     */
    @GetMapping("/high-utilization")
    public List<MachineCapacityDto> findHighUtilizationMachines() {
        return machineCapacityService.findHighUtilizationMachines();
    }
    
    /**
     * Get machine capacity with low utilization
     */
    @GetMapping("/low-utilization")
    public List<MachineCapacityDto> findLowUtilizationMachines() {
        return machineCapacityService.findLowUtilizationMachines();
    }
    
    /**
     * Get machine capacity with high downtime
     */
    @GetMapping("/high-downtime")
    public List<MachineCapacityDto> findHighDowntimeMachines() {
        return machineCapacityService.findHighDowntimeMachines();
    }
    
    /**
     * Export machine capacities to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<MachineCapacityDto> data = machineCapacityService.list(params.get("q"), 
            params.get("machineId"), 
            params.get("machineType"), 
            params.get("date") != null ? LocalDate.parse(params.get("date")) : null,
            params.get("shift") != null ? MachineCapacity.Shift.valueOf(params.get("shift").toUpperCase()) : null,
            params.get("status") != null ? MachineCapacity.Status.valueOf(params.get("status").toUpperCase()) : null,
            params.get("workOrderId"), 
            params.get("operationId"));
        String csv = machineCapacityService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=machine-capacity.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get machine capacity statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return machineCapacityService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}