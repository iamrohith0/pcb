package com.pcbxpress.erp.modules.production.controller;

import com.pcbxpress.erp.modules.audit.model.AuditEvent.Operation;
import com.pcbxpress.erp.modules.audit.service.AuditService;
import com.pcbxpress.erp.modules.production.dto.WorkOrderDto;
import com.pcbxpress.erp.modules.production.dto.WorkOrderPayload;
import com.pcbxpress.erp.modules.production.exception.WorkOrderException;
import com.pcbxpress.erp.modules.production.model.WorkOrder;
import com.pcbxpress.erp.modules.production.service.ProductionPermissionService;
import com.pcbxpress.erp.modules.production.service.ProductionValidationService;
import com.pcbxpress.erp.modules.production.service.WorkOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Work Orders with RBAC integration
 */
@RestController
@RequestMapping("/api/production/work-orders")
public class WorkOrderController {
    
    private final WorkOrderService workOrderService;
    // private final ProductionPermissionService permissionService; // Not used in this controller
    private final ProductionValidationService validationService;
    private final AuditService auditService;
    
    @Autowired
    public WorkOrderController(WorkOrderService workOrderService,
                             ProductionValidationService validationService,
                             AuditService auditService) {
        this.workOrderService = workOrderService;
        this.validationService = validationService;
        this.auditService = auditService;
    }
    
    /**
     * List work orders with optional filters
     */
    @GetMapping
    @PreAuthorize("hasAuthority('production:read')")
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String statusStr = params.get("status");
        String priorityStr = params.get("priority");
        String itemCode = params.get("itemCode");
        String customerPO = params.get("customerPO");
        
        WorkOrder.WorkOrderStatus status = statusStr != null ? WorkOrder.WorkOrderStatus.valueOf(statusStr.toUpperCase()) : null;
        WorkOrder.Priority priority = priorityStr != null ? WorkOrder.Priority.valueOf(priorityStr.toUpperCase()) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<WorkOrderDto> filtered = workOrderService.list(query, status, priority, itemCode, customerPO);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<WorkOrderDto> items = filtered.subList(fromIndex, toIndex);
        
        // Log audit event
        auditService.logSuccess("PRODUCTION", "WORK_ORDER", null,
                              Operation.READ,
                              "Work orders listed with filters", null, null);
        
        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single work order by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('production:read')")
    public WorkOrderDto get(@PathVariable String id) {
        try {
            WorkOrderDto workOrder = workOrderService.get(id);
            
            // Log audit event
            auditService.logSuccess("PRODUCTION", "WORK_ORDER", id,
                                  Operation.READ,
                                  "Work order retrieved", null, null);
            
            return workOrder;
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", id,
                                  Operation.READ,
                                  "Failed to retrieve work order", e.getMessage(), null, null);
            throw e;
        }
    }
    
    /**
     * Create a new work order
     */
    @PostMapping
    @PreAuthorize("hasAuthority('production:create')")
    public ResponseEntity<WorkOrderDto> create(@RequestBody WorkOrderPayload payload) {
        try {
            // Validate input
            ProductionValidationService.ValidationResult validationResult =
                validationService.validateWorkOrderCreation(null, payload);
            
            if (!validationResult.isValid()) {
                throw new WorkOrderException.WorkOrderValidationException(validationResult.getErrorMessage());
            }
            
            WorkOrderDto created = workOrderService.create(payload);
            
            // Log audit event
            auditService.logWorkOrderCreated(created.id(), created.workOrderNumber(), created);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", null,
                                  Operation.CREATE,
                                  "Failed to create work order", e.getMessage(), null, payload);
            throw e;
        }
    }
    
    /**
     * Update an existing work order
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('production:update')")
    public WorkOrderDto update(@PathVariable String id, @RequestBody WorkOrderPayload payload) {
        try {
            // Validate input
            ProductionValidationService.ValidationResult validationResult =
                validationService.validateWorkOrderUpdate(null, id, payload);
            
            if (!validationResult.isValid()) {
                throw new WorkOrderException.WorkOrderValidationException(validationResult.getErrorMessage());
            }
            
            WorkOrderDto updated = workOrderService.update(id, payload);
            
            // Log audit event
            auditService.logWorkOrderUpdated(id, updated.workOrderNumber(), null, updated);
            
            return updated;
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", id,
                                  Operation.UPDATE,
                                  "Failed to update work order", e.getMessage(), null, payload);
            throw e;
        }
    }
    
    /**
     * Delete a work order
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('production:delete')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        try {
            WorkOrderDto workOrder = workOrderService.get(id);
            workOrderService.delete(id);
            
            // Log audit event
            auditService.logWorkOrderDeleted(id, workOrder.workOrderNumber(), workOrder);
            
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", id,
                                  Operation.DELETE,
                                  "Failed to delete work order", e.getMessage(), null, null);
            throw e;
        }
    }
    
    /**
     * Bulk delete work orders
     */
    @DeleteMapping("/bulk")
    @PreAuthorize("hasAuthority('production:delete')")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        try {
            List<String> ids = request.getOrDefault("ids", List.of());
            
            // Get work orders for audit logging
            List<WorkOrderDto> workOrders = ids.stream()
                .map(id -> workOrderService.get(id))
                .toList();
            
            workOrderService.deleteBulk(ids);
            
            // Log audit event
            auditService.logBatchOperation("PRODUCTION", "WORK_ORDER",
                                         Operation.DELETE,
                                         "Bulk delete work orders", ids.size(), workOrders);
            
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", null,
                                  Operation.DELETE,
                                  "Failed to bulk delete work orders", e.getMessage(), null, null);
            throw e;
        }
    }
    
    /**
     * Search work orders
     */
    @GetMapping("/search")
    @PreAuthorize("hasAuthority('production:read')")
    public List<WorkOrderDto> search(@RequestParam String q) {
        try {
            List<WorkOrderDto> results = workOrderService.search(q);
            
            // Log audit event
            auditService.logSuccess("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Work orders searched with query: " + q, null, null);
            
            return results;
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Failed to search work orders", e.getMessage(), null, null);
            throw e;
        }
    }
    
    /**
     * Get work orders due today
     */
    @GetMapping("/due-today")
    @PreAuthorize("hasAuthority('production:read')")
    public List<WorkOrderDto> findDueToday() {
        try {
            List<WorkOrderDto> results = workOrderService.findDueToday();
            
            // Log audit event
            auditService.logSuccess("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Work orders due today retrieved", null, null);
            
            return results;
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Failed to get work orders due today", e.getMessage(), null, null);
            throw e;
        }
    }
    
    /**
     * Get work orders overdue
     */
    @GetMapping("/overdue")
    @PreAuthorize("hasAuthority('production:read')")
    public List<WorkOrderDto> findOverdue() {
        try {
            List<WorkOrderDto> results = workOrderService.findOverdue();
            
            // Log audit event
            auditService.logSuccess("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Overdue work orders retrieved", null, null);
            
            return results;
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Failed to get overdue work orders", e.getMessage(), null, null);
            throw e;
        }
    }
    
    /**
     * Get work orders in progress
     */
    @GetMapping("/in-progress")
    @PreAuthorize("hasAuthority('production:read')")
    public List<WorkOrderDto> findInProgress() {
        try {
            List<WorkOrderDto> results = workOrderService.findInProgress();
            
            // Log audit event
            auditService.logSuccess("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "In-progress work orders retrieved", null, null);
            
            return results;
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Failed to get in-progress work orders", e.getMessage(), null, null);
            throw e;
        }
    }
    
    /**
     * Get work orders completed today
     */
    @GetMapping("/completed-today")
    @PreAuthorize("hasAuthority('production:read')")
    public List<WorkOrderDto> findCompletedToday() {
        try {
            List<WorkOrderDto> results = workOrderService.findCompletedToday();
            
            // Log audit event
            auditService.logSuccess("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Completed work orders retrieved", null, null);
            
            return results;
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Failed to get completed work orders", e.getMessage(), null, null);
            throw e;
        }
    }
    
    /**
     * Export work orders to CSV
     */
    @GetMapping("/export/csv")
    @PreAuthorize("hasAuthority('reports:export')")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        try {
            List<WorkOrderDto> data = workOrderService.list(params.get("q"),
                params.get("status") != null ? WorkOrder.WorkOrderStatus.valueOf(params.get("status").toUpperCase()) : null,
                params.get("priority") != null ? WorkOrder.Priority.valueOf(params.get("priority").toUpperCase()) : null,
                params.get("itemCode"),
                params.get("customerPO"));
            String csv = workOrderService.exportCsv(data);
            ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
            
            // Log audit event
            auditService.logExport("PRODUCTION", "WORK_ORDER",
                                 "Work orders exported to CSV", data.size(), params);
            
            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=work-orders.csv")
                .contentLength(resource.contentLength())
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(resource);
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", null,
                                  Operation.EXPORT,
                                  "Failed to export work orders to CSV", e.getMessage(), null, null);
            throw e;
        }
    }
    
    /**
     * Get work order statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('reports:read')")
    public Map<String, Object> stats() {
        try {
            Map<String, Object> stats = workOrderService.getStats();
            
            // Log audit event
            auditService.logSuccess("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Work order statistics retrieved", null, null);
            
            return stats;
        } catch (Exception e) {
            // Log audit event for failed operation
            auditService.logFailure("PRODUCTION", "WORK_ORDER", null,
                                  Operation.READ,
                                  "Failed to get work order statistics", e.getMessage(), null, null);
            throw e;
        }
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}