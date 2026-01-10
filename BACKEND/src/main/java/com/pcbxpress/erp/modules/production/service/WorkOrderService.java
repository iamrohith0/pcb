package com.pcbxpress.erp.modules.production.service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pcbxpress.erp.modules.production.dto.WorkOrderDto;
import com.pcbxpress.erp.modules.production.dto.WorkOrderPayload;
import com.pcbxpress.erp.modules.production.model.WorkOrder;
import com.pcbxpress.erp.modules.production.repository.WorkOrderRepository;

/**
 * Service for managing Work Orders
 */
@Service
@Transactional
public class WorkOrderService {
    
    private final WorkOrderRepository workOrderRepository;
    
    public WorkOrderService(WorkOrderRepository workOrderRepository) {
        this.workOrderRepository = workOrderRepository;
    }
    
    /**
     * List work orders with optional filters
     */
    public List<WorkOrderDto> list(String query, WorkOrder.WorkOrderStatus status, WorkOrder.Priority priority, String itemCode, String customerPO) {
        return workOrderRepository.findByCriteria(status, priority, itemCode, customerPO, query).stream()
            .sorted(Comparator.comparing(WorkOrder::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single work order by ID
     */
    public WorkOrderDto get(String id) {
        WorkOrder workOrder = workOrderRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Work order not found: " + id));
        return toDto(workOrder);
    }
    
    /**
     * Create a new work order
     */
    public WorkOrderDto create(WorkOrderPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(UUID.randomUUID());
        applyPayload(workOrder, payload);
        
        // Auto-generate work order number if not provided
        if (workOrder.getWorkOrderNumber() == null || workOrder.getWorkOrderNumber().isBlank()) {
            workOrder.setWorkOrderNumber(generateWorkOrderNumber());
        }
        
        // Set default values
        if (workOrder.getStatus() == null) {
            workOrder.setStatus(WorkOrder.WorkOrderStatus.DRAFT);
        }
        
        if (workOrder.getPriority() == null) {
            workOrder.setPriority(WorkOrder.Priority.MEDIUM);
        }
        
        WorkOrder saved = workOrderRepository.save(workOrder);
        return toDto(saved);
    }
    
    /**
     * Update an existing work order
     */
    public WorkOrderDto update(String id, WorkOrderPayload payload) {
        WorkOrder existing = workOrderRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Work order not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        WorkOrder saved = workOrderRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a work order
     */
    public void delete(String id) {
        workOrderRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple work orders
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(WorkOrderService::parseId).collect(Collectors.toList());
        workOrderRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search work orders by query
     */
    public List<WorkOrderDto> search(String query) {
        return workOrderRepository.findByCriteria(null, null, null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get work orders due today
     */
    public List<WorkOrderDto> findDueToday() {
        LocalDate today = LocalDate.now();
        List<WorkOrder.WorkOrderStatus> statuses = List.of(
            WorkOrder.WorkOrderStatus.IN_PROGRESS,
            WorkOrder.WorkOrderStatus.ON_HOLD
        );
        return workOrderRepository.findDueToday(today, statuses).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get work orders overdue
     */
    public List<WorkOrderDto> findOverdue() {
        LocalDate today = LocalDate.now();
        List<WorkOrder.WorkOrderStatus> statuses = List.of(
            WorkOrder.WorkOrderStatus.IN_PROGRESS,
            WorkOrder.WorkOrderStatus.ON_HOLD
        );
        return workOrderRepository.findOverdue(today, statuses).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get work orders in progress
     */
    public List<WorkOrderDto> findInProgress() {
        return workOrderRepository.findInProgress(WorkOrder.WorkOrderStatus.IN_PROGRESS).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get work orders completed today
     */
    public List<WorkOrderDto> findCompletedToday() {
        LocalDate today = LocalDate.now();
        return workOrderRepository.findCompletedToday(today, WorkOrder.WorkOrderStatus.COMPLETED).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get work order statistics
     */
    public Map<String, Object> getStats() {
        List<WorkOrder> all = workOrderRepository.findAll();
        long total = all.size();
        long draft = all.stream().filter(w -> w.getStatus() == WorkOrder.WorkOrderStatus.DRAFT).count();
        long released = all.stream().filter(w -> w.getStatus() == WorkOrder.WorkOrderStatus.RELEASED).count();
        long inProgress = all.stream().filter(w -> w.getStatus() == WorkOrder.WorkOrderStatus.IN_PROGRESS).count();
        long onHold = all.stream().filter(w -> w.getStatus() == WorkOrder.WorkOrderStatus.ON_HOLD).count();
        long completed = all.stream().filter(w -> w.getStatus() == WorkOrder.WorkOrderStatus.COMPLETED).count();
        long cancelled = all.stream().filter(w -> w.getStatus() == WorkOrder.WorkOrderStatus.CANCELLED).count();
        
        // Count by priority
        Map<WorkOrder.Priority, Long> byPriority = all.stream()
            .collect(Collectors.groupingBy(WorkOrder::getPriority, Collectors.counting()));
        
        // Count by item code
        Map<String, Long> byItemCode = all.stream()
            .filter(w -> w.getItemCode() != null)
            .collect(Collectors.groupingBy(WorkOrder::getItemCode, Collectors.counting()));
        
        // Calculate total quantities
        int totalQuantity = all.stream().mapToInt(w -> w.getQuantity() != null ? w.getQuantity() : 0).sum();
        int completedQuantity = all.stream().mapToInt(w -> w.getCompletedQuantity() != null ? w.getCompletedQuantity() : 0).sum();
        int scrapQuantity = all.stream().mapToInt(w -> w.getScrapQuantity() != null ? w.getScrapQuantity() : 0).sum();
        
        return Map.ofEntries(
            Map.entry("total", total),
            Map.entry("draft", draft),
            Map.entry("released", released),
            Map.entry("inProgress", inProgress),
            Map.entry("onHold", onHold),
            Map.entry("completed", completed),
            Map.entry("cancelled", cancelled),
            Map.entry("byPriority", byPriority),
            Map.entry("byItemCode", byItemCode),
            Map.entry("totalQuantity", totalQuantity),
            Map.entry("completedQuantity", completedQuantity),
            Map.entry("scrapQuantity", scrapQuantity)
        );
    }
    
    /**
     * Export work orders to CSV format
     */
    public String exportCsv(List<WorkOrderDto> data) {
        String header = "Work Order Number,Customer PO,Item Code,Item Description,Quantity,Status,Priority,Due Date,Start Date,Completed Date,Estimated Hours,Actual Hours,Is Rush,Is Critical";
        String rows = data.stream()
            .map(workOrder -> String.join(",",
                safe(workOrder.workOrderNumber()),
                safe(workOrder.customerPO()),
                safe(workOrder.itemCode()),
                safe(workOrder.itemDescription()),
                safe(workOrder.quantity() != null ? workOrder.quantity().toString() : ""),
                safe(workOrder.status() != null ? workOrder.status().toString() : ""),
                safe(workOrder.priority() != null ? workOrder.priority().toString() : ""),
                safe(workOrder.dueDate() != null ? workOrder.dueDate().toString() : ""),
                safe(workOrder.startDate() != null ? workOrder.startDate().toString() : ""),
                safe(workOrder.completedDate() != null ? workOrder.completedDate().toString() : ""),
                safe(workOrder.estimatedHours() != null ? workOrder.estimatedHours().toString() : ""),
                safe(workOrder.actualHours() != null ? workOrder.actualHours().toString() : ""),
                workOrder.isRush() ? "Yes" : "No",
                workOrder.isCritical() ? "Yes" : "No"
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Work order not found: " + id);
        }
    }
    
    private static String generateWorkOrderNumber() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "WO-" + token;
    }
    
    private void validateUniqueConstraints(WorkOrderPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate work order number
        if (payload.workOrderNumber() != null && !payload.workOrderNumber().isBlank()) {
            WorkOrder existing = workOrderRepository.findByWorkOrderNumberIgnoreCase(payload.workOrderNumber());
            if (existing != null && !existing.getId().equals(existingUUID)) {
                throw new IllegalArgumentException("Work order number already exists: " + payload.workOrderNumber());
            }
        }
        
        // Check for duplicate customer PO
        if (payload.customerPO() != null && !payload.customerPO().isBlank()) {
            WorkOrder existing = workOrderRepository.findByCustomerPO(payload.customerPO());
            if (existing != null && !existing.getId().equals(existingUUID)) {
                throw new IllegalArgumentException("Customer PO already exists: " + payload.customerPO());
            }
        }
    }
    
    private void applyPayload(WorkOrder target, WorkOrderPayload payload) {
        target.setWorkOrderNumber(payload.workOrderNumber());
        target.setCustomerPO(payload.customerPO());
        target.setItemCode(payload.itemCode());
        target.setItemDescription(payload.itemDescription());
        target.setQuantity(payload.quantity());
        target.setStatus(payload.status());
        target.setPriority(payload.priority());
        target.setRoutingId(payload.routingId() != null ? UUID.fromString(payload.routingId()) : null);
        target.setStartDate(payload.startDate());
        target.setDueDate(payload.dueDate());
        target.setCompletedDate(payload.completedDate());
        target.setCompletedQuantity(payload.completedQuantity());
        target.setScrapQuantity(payload.scrapQuantity());
        target.setEstimatedHours(payload.estimatedHours());
        target.setActualHours(payload.actualHours());
        target.setRoutingNotes(payload.routingNotes());
        target.setQualityNotes(payload.qualityNotes());
        target.setProductionNotes(payload.productionNotes());
        target.setRush(payload.isRush());
        target.setCritical(payload.isCritical());
        target.setCustomerId(payload.customerId() != null ? UUID.fromString(payload.customerId()) : null);
        target.setSalesOrderId(payload.salesOrderId() != null ? UUID.fromString(payload.salesOrderId()) : null);
        target.setProjectId(payload.projectId() != null ? UUID.fromString(payload.projectId()) : null);
    }
    
    private WorkOrderDto toDto(WorkOrder workOrder) {
        return new WorkOrderDto(
            workOrder.getId().toString(),
            workOrder.getWorkOrderNumber(),
            workOrder.getCustomerPO(),
            workOrder.getItemCode(),
            workOrder.getItemDescription(),
            workOrder.getQuantity(),
            workOrder.getStatus(),
            workOrder.getPriority(),
            workOrder.getRoutingId() != null ? workOrder.getRoutingId().toString() : null,
            workOrder.getStartDate(),
            workOrder.getDueDate(),
            workOrder.getCompletedDate(),
            workOrder.getCompletedQuantity(),
            workOrder.getScrapQuantity(),
            workOrder.getEstimatedHours(),
            workOrder.getActualHours(),
            workOrder.getRoutingNotes(),
            workOrder.getQualityNotes(),
            workOrder.getProductionNotes(),
            workOrder.isRush(),
            workOrder.isCritical(),
            workOrder.getCustomerId() != null ? workOrder.getCustomerId().toString() : null,
            workOrder.getSalesOrderId() != null ? workOrder.getSalesOrderId().toString() : null,
            workOrder.getProjectId() != null ? workOrder.getProjectId().toString() : null,
            safeOffset(workOrder.getCreatedAt()),
            safeOffset(workOrder.getUpdatedAt())
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}