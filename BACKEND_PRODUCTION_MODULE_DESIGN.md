# Backend Production Module Design Document

## Overview

This document provides a comprehensive design blueprint for implementing the Production module in the PCBXpress ERP system. The design follows established patterns from existing modules (Inventory, Sales, Engineering) while addressing the specific requirements of production workflow management.

## Table of Contents

1. [Package Structure Design](#package-structure-design)
2. [Entity/Model Design](#entitymodel-design)
3. [DTO Design Patterns](#dto-design-patterns)
4. [Service Layer Design](#service-layer-design)
5. [Controller Design](#controller-design)
6. [Database Migration Design](#database-migration-design)
7. [Integration Points](#integration-points)
8. [API Endpoints](#api-endpoints)
9. [Business Rules](#business-rules)
10. [Error Handling](#error-handling)

## Package Structure Design

Following the established module pattern, the production module will be organized as follows:

```
BACKEND/src/main/java/com/pcbxpress/erp/modules/production/
├── controller/
│   ├── WorkOrderController.java
│   ├── RoutingController.java
│   ├── WIPController.java
│   ├── CapacityController.java
│   ├── SchedulingController.java
│   ├── ProductionReportsController.java
│   └── MaterialIssueController.java
├── dto/
│   ├── workorder/
│   │   ├── WorkOrderDto.java
│   │   ├── WorkOrderPayload.java
│   │   ├── WorkOrderSummaryDto.java
│   │   └── WorkOrderStatusDto.java
│   ├── routing/
│   │   ├── RoutingDto.java
│   │   ├── RoutingPayload.java
│   │   ├── OperationDto.java
│   │   └── OperationPayload.java
│   ├── wip/
│   │   ├── WIPEventDto.java
│   │   ├── WIPEventPayload.java
│   │   ├── WIPSummaryDto.java
│   │   └── WIPHoldReleaseDto.java
│   ├── capacity/
│   │   ├── MachineCapacityDto.java
│   │   ├── MachineCapacityPayload.java
│   │   ├── LaborCapacityDto.java
│   │   └── CapacitySummaryDto.java
│   ├── scheduling/
│   │   ├── ProductionScheduleDto.java
│   │   ├── SchedulePayload.java
│   │   └── ScheduleConflictDto.java
│   └── material/
│       ├── MaterialIssueDto.java
│       ├── MaterialIssuePayload.java
│       └── MaterialRequirementDto.java
├── model/
│   ├── workorder/
│   │   ├── WorkOrder.java
│   │   ├── WorkOrderStatus.java
│   │   ├── WorkOrderType.java
│   │   └── PriorityLevel.java
│   ├── routing/
│   │   ├── Routing.java
│   │   ├── Operation.java
│   │   ├── OperationType.java
│   │   └── WorkCenter.java
│   ├── wip/
│   │   ├── WIPEvent.java
│   │   ├── WIPStatus.java
│   │   ├── WIPEventType.java
│   │   └── WIPHoldReason.java
│   ├── capacity/
│   │   ├── MachineCapacity.java
│   │   ├── LaborCapacity.java
│   │   ├── Shift.java
│   │   └── CapacityType.java
│   ├── scheduling/
│   │   ├── ProductionSchedule.java
│   │   ├── ScheduleStatus.java
│   │   └── ScheduleType.java
│   └── material/
│       ├── MaterialIssue.java
│       ├── MaterialRequirement.java
│       ├── IssueStatus.java
│       └── IssueType.java
├── repository/
│   ├── workorder/
│   │   ├── WorkOrderRepository.java
│   │   └── WorkOrderCustomRepository.java
│   ├── routing/
│   │   ├── RoutingRepository.java
│   │   └── OperationRepository.java
│   ├── wip/
│   │   ├── WIPEventRepository.java
│   │   └── WIPEventCustomRepository.java
│   ├── capacity/
│   │   ├── MachineCapacityRepository.java
│   │   └── LaborCapacityRepository.java
│   ├── scheduling/
│   │   ├── ProductionScheduleRepository.java
│   │   └── ProductionScheduleCustomRepository.java
│   └── material/
│       ├── MaterialIssueRepository.java
│       └── MaterialRequirementRepository.java
└── service/
    ├── workorder/
    │   ├── WorkOrderService.java
    │   └── WorkOrderValidationService.java
    ├── routing/
    │   ├── RoutingService.java
    │   └── OperationService.java
    ├── wip/
    │   ├── WIPService.java
    │   └── WIPValidationService.java
    ├── capacity/
    │   ├── CapacityService.java
    │   └── CapacityPlanningService.java
    ├── scheduling/
    │   ├── SchedulingService.java
    │   └── ScheduleOptimizationService.java
    └── material/
        ├── MaterialIssueService.java
        └── MaterialRequirementService.java
```

## Entity/Model Design

### 1. WorkOrder Entity

```java
@Entity
@Table(name = "production_work_orders", indexes = {
    @Index(name = "idx_wo_number", columnList = "work_order_number"),
    @Index(name = "idx_wo_status", columnList = "status"),
    @Index(name = "idx_wo_product", columnList = "product_item_id"),
    @Index(name = "idx_wo_sales_order", columnList = "sales_order_id"),
    @Index(name = "idx_wo_priority", columnList = "priority"),
    @Index(name = "idx_wo_start_date", columnList = "start_date"),
    @Index(name = "idx_wo_end_date", columnList = "end_date")
})
public class WorkOrder {
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "work_order_number", nullable = false, unique = true, length = 50)
    private String workOrderNumber;
    
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private WorkOrderStatus status;
    
    @Column(name = "type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private WorkOrderType type;
    
    @Column(name = "priority", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PriorityLevel priority;
    
    @Column(name = "product_item_id", nullable = false)
    private UUID productItemId;
    
    @Column(name = "sales_order_id")
    private UUID salesOrderId;
    
    @Column(name = "sales_order_line_id")
    private UUID salesOrderLineId;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "completed_quantity", nullable = false)
    private Integer completedQuantity;
    
    @Column(name = "scrap_quantity", nullable = false)
    private Integer scrapQuantity;
    
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    
    @Column(name = "actual_start_date")
    private LocalDate actualStartDate;
    
    @Column(name = "actual_end_date")
    private LocalDate actualEndDate;
    
    @Column(name = "routing_id")
    private UUID routingId;
    
    @Column(name = "estimated_hours")
    private BigDecimal estimatedHours;
    
    @Column(name = "actual_hours")
    private BigDecimal actualHours;
    
    @Column(name = "estimated_cost", precision = 15, scale = 2)
    private BigDecimal estimatedCost;
    
    @Column(name = "actual_cost", precision = 15, scale = 2)
    private BigDecimal actualCost;
    
    @Column(name = "notes", length = 1000)
    private String notes;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    // Getters and Setters
}
```

### 2. Routing Entity

```java
@Entity
@Table(name = "production_routings", indexes = {
    @Index(name = "idx_routing_product", columnList = "product_item_id"),
    @Index(name = "idx_routing_status", columnList = "status"),
    @Index(name = "idx_routing_version", columnList = "version")
})
public class Routing {
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "routing_number", nullable = false, unique = true, length = 50)
    private String routingNumber;
    
    @Column(name = "product_item_id", nullable = false)
    private UUID productItemId;
    
    @Column(name = "version", nullable = false, length = 20)
    private String version;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private RoutingStatus status;
    
    @Column(name = "is_default", nullable = false)
    private boolean isDefault;
    
    @Column(name = "estimated_total_time")
    private BigDecimal estimatedTotalTime;
    
    @Column(name = "estimated_total_cost", precision = 15, scale = 2)
    private BigDecimal estimatedTotalCost;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    // Getters and Setters
}
```

### 3. Operation Entity

```java
@Entity
@Table(name = "production_operations", indexes = {
    @Index(name = "idx_operation_routing", columnList = "routing_id"),
    @Index(name = "idx_operation_work_center", columnList = "work_center_id"),
    @Index(name = "idx_operation_sequence", columnList = "sequence_number")
})
public class Operation {
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "routing_id", nullable = false)
    private UUID routingId;
    
    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;
    
    @Column(name = "operation_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private OperationType operationType;
    
    @Column(name = "work_center_id", nullable = false)
    private UUID workCenterId;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "setup_time")
    private BigDecimal setupTime;
    
    @Column(name = "run_time")
    private BigDecimal runTime;
    
    @Column(name = "machine_time")
    private BigDecimal machineTime;
    
    @Column(name = "labor_time")
    private BigDecimal laborTime;
    
    @Column(name = "estimated_cost", precision = 15, scale = 2)
    private BigDecimal estimatedCost;
    
    @Column(name = "standard_rate", precision = 15, scale = 2)
    private BigDecimal standardRate;
    
    @Column(name = "minimum_quantity")
    private Integer minimumQuantity;
    
    @Column(name = "maximum_quantity")
    private Integer maximumQuantity;
    
    @Column(name = "is_critical", nullable = false)
    private boolean isCritical;
    
    @Column(name = "quality_check_required", nullable = false)
    private boolean qualityCheckRequired;
    
    @Column(name = "notes", length = 500)
    private String notes;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    // Getters and Setters
}
```

### 4. WIPEvent Entity

```java
@Entity
@Table(name = "production_wip_events", indexes = {
    @Index(name = "idx_wip_wo", columnList = "work_order_id"),
    @Index(name = "idx_wip_operation", columnList = "operation_id"),
    @Index(name = "idx_wip_type", columnList = "event_type"),
    @Index(name = "idx_wip_status", columnList = "status"),
    @Index(name = "idx_wip_timestamp", columnList = "event_timestamp")
})
public class WIPEvent {
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "work_order_id", nullable = false)
    private UUID workOrderId;
    
    @Column(name = "operation_id", nullable = false)
    private UUID operationId;
    
    @Column(name = "event_type", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private WIPEventType eventType;
    
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private WIPStatus status;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "event_timestamp", nullable = false)
    private OffsetDateTime eventTimestamp;
    
    @Column(name = "operator_id")
    private UUID operatorId;
    
    @Column(name = "machine_id")
    private UUID machineId;
    
    @Column(name = "batch_number", length = 100)
    private String batchNumber;
    
    @Column(name = "hold_reason", length = 200)
    private String holdReason;
    
    @Column(name = "release_reason", length = 200)
    private String releaseReason;
    
    @Column(name = "quality_remarks", length = 500)
    private String qualityRemarks;
    
    @Column(name = "scrap_reason", length = 200)
    private String scrapReason;
    
    @Column(name = "notes", length = 1000)
    private String notes;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    // Getters and Setters
}
```

### 5. MachineCapacity Entity

```java
@Entity
@Table(name = "production_machine_capacity", indexes = {
    @Index(name = "idx_machine_capacity_machine", columnList = "machine_id"),
    @Index(name = "idx_machine_capacity_date", columnList = "date"),
    @Index(name = "idx_machine_capacity_shift", columnList = "shift_id")
})
public class MachineCapacity {
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "machine_id", nullable = false)
    private UUID machineId;
    
    @Column(name = "date", nullable = false)
    private LocalDate date;
    
    @Column(name = "shift_id", nullable = false)
    private UUID shiftId;
    
    @Column(name = "available_hours", nullable = false)
    private BigDecimal availableHours;
    
    @Column(name = "planned_hours")
    private BigDecimal plannedHours;
    
    @Column(name = "utilized_hours")
    private BigDecimal utilizedHours;
    
    @Column(name = "efficiency_percentage")
    private BigDecimal efficiencyPercentage;
    
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private CapacityStatus status;
    
    @Column(name = "notes", length = 500)
    private String notes;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    // Getters and Setters
}
```

## DTO Design Patterns

### 1. WorkOrder DTO

```java
public record WorkOrderDto(
    String id,
    String workOrderNumber,
    WorkOrderStatus status,
    WorkOrderType type,
    PriorityLevel priority,
    String productItemId,
    String productName,
    String productCode,
    String salesOrderId,
    String salesOrderNumber,
    Integer quantity,
    Integer completedQuantity,
    Integer scrapQuantity,
    LocalDate startDate,
    LocalDate endDate,
    LocalDate actualStartDate,
    LocalDate actualEndDate,
    String routingId,
    String routingNumber,
    BigDecimal estimatedHours,
    BigDecimal actualHours,
    BigDecimal estimatedCost,
    BigDecimal actualCost,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
```

### 2. WorkOrder Payload

```java
public record WorkOrderPayload(
    @JsonAlias({"work_order_number", "workOrderNumber"}) String workOrderNumber,
    @JsonAlias({"status"}) WorkOrderStatus status,
    @JsonAlias({"type"}) WorkOrderType type,
    @JsonAlias({"priority"}) PriorityLevel priority,
    @JsonAlias({"product_item_id", "productItemId"}) String productItemId,
    @JsonAlias({"sales_order_id", "salesOrderId"}) String salesOrderId,
    @JsonAlias({"sales_order_line_id", "salesOrderLineId"}) String salesOrderLineId,
    @JsonAlias({"quantity"}) Integer quantity,
    @JsonAlias({"completed_quantity", "completedQuantity"}) Integer completedQuantity,
    @JsonAlias({"scrap_quantity", "scrapQuantity"}) Integer scrapQuantity,
    @JsonAlias({"start_date", "startDate"}) LocalDate startDate,
    @JsonAlias({"end_date", "endDate"}) LocalDate endDate,
    @JsonAlias({"actual_start_date", "actualStartDate"}) LocalDate actualStartDate,
    @JsonAlias({"actual_end_date", "actualEndDate"}) LocalDate actualEndDate,
    @JsonAlias({"routing_id", "routingId"}) String routingId,
    @JsonAlias({"estimated_hours", "estimatedHours"}) BigDecimal estimatedHours,
    @JsonAlias({"actual_hours", "actualHours"}) BigDecimal actualHours,
    @JsonAlias({"estimated_cost", "estimatedCost"}) BigDecimal estimatedCost,
    @JsonAlias({"actual_cost", "actualCost"}) BigDecimal actualCost,
    @JsonAlias({"notes"}) String notes
) {}
```

### 3. WIPEvent DTO

```java
public record WIPEventDto(
    String id,
    String workOrderId,
    String workOrderNumber,
    String operationId,
    String operationType,
    String workCenterId,
    String workCenterName,
    WIPEventType eventType,
    WIPStatus status,
    Integer quantity,
    OffsetDateTime eventTimestamp,
    String operatorId,
    String operatorName,
    String machineId,
    String machineName,
    String batchNumber,
    String holdReason,
    String releaseReason,
    String qualityRemarks,
    String scrapReason,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
```

## Service Layer Design

### 1. WorkOrderService

```java
@Service
@Transactional
public class WorkOrderService {
    
    private final WorkOrderRepository workOrderRepository;
    private final WorkOrderValidationService validationService;
    private final RoutingService routingService;
    private final MaterialRequirementService materialRequirementService;
    
    public WorkOrderService(WorkOrderRepository workOrderRepository,
                           WorkOrderValidationService validationService,
                           RoutingService routingService,
                           MaterialRequirementService materialRequirementService) {
        this.workOrderRepository = workOrderRepository;
        this.validationService = validationService;
        this.routingService = routingService;
        this.materialRequirementService = materialRequirementService;
    }
    
    public List<WorkOrderDto> list(String query, WorkOrderStatus status, WorkOrderType type, 
                                  LocalDate from, LocalDate to, PriorityLevel priority) {
        // Implementation following existing patterns
    }
    
    public WorkOrderDto get(String id) {
        // Implementation
    }
    
    public WorkOrderDto create(WorkOrderPayload payload) {
        // Validate payload
        validationService.validateCreate(payload);
        
        // Create work order
        WorkOrder workOrder = new WorkOrder();
        workOrder.setId(UUID.randomUUID());
        workOrder.setWorkOrderNumber(generateWorkOrderNumber());
        workOrder.setStatus(WorkOrderStatus.DRAFT);
        // Apply payload data
        
        // Create material requirements
        materialRequirementService.createMaterialRequirements(workOrder);
        
        WorkOrder saved = workOrderRepository.save(workOrder);
        return toDto(saved);
    }
    
    public WorkOrderDto update(String id, WorkOrderPayload payload) {
        // Implementation
    }
    
    public WorkOrderDto updateStatus(String id, WorkOrderStatus newStatus) {
        // Implementation with business rule validation
    }
    
    public void delete(String id) {
        // Implementation with validation
    }
    
    public List<WorkOrderDto> findOverdue() {
        // Implementation
    }
    
    public List<WorkOrderDto> findHighPriority() {
        // Implementation
    }
    
    public Map<String, Object> getStats() {
        // Implementation
    }
}
```

### 2. WIPService

```java
@Service
@Transactional
public class WIPService {
    
    private final WIPEventRepository wipEventRepository;
    private final WorkOrderService workOrderService;
    private final OperationService operationService;
    
    public WIPService(WIPEventRepository wipEventRepository,
                      WorkOrderService workOrderService,
                      OperationService operationService) {
        this.wipEventRepository = wipEventRepository;
        this.workOrderService = workOrderService;
        this.operationService = operationService;
    }
    
    public List<WIPEventDto> list(String workOrderId, WIPEventType eventType, 
                                 WIPStatus status, LocalDate from, LocalDate to) {
        // Implementation
    }
    
    public WIPEventDto create(WIPEventPayload payload) {
        // Validate and create WIP event
        // Update work order progress
        // Trigger notifications if needed
    }
    
    public WIPEventDto hold(String id, String reason) {
        // Implementation
    }
    
    public WIPEventDto release(String id, String reason) {
        // Implementation
    }
    
    public WIPSummaryDto getSummary(String workOrderId) {
        // Implementation
    }
}
```

## Controller Design

### 1. WorkOrderController

```java
@RestController
@RequestMapping("/api/production/work-orders")
public class WorkOrderController {
    
    private final WorkOrderService workOrderService;
    
    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }
    
    @GetMapping
    public Map<String, Object> list(
        @RequestParam(name = "q", required = false) String query,
        @RequestParam(name = "status", required = false) WorkOrderStatus status,
        @RequestParam(name = "type", required = false) WorkOrderType type,
        @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(name = "priority", required = false) PriorityLevel priority,
        @RequestParam(name = "page", defaultValue = "1") int page,
        @RequestParam(name = "limit", defaultValue = "20") int limit
    ) {
        List<WorkOrderDto> filtered = workOrderService.list(query, status, type, from, to, priority);
        // Pagination logic following existing patterns
    }
    
    @GetMapping("/{id}")
    public WorkOrderDto get(@PathVariable String id) {
        return workOrderService.get(id);
    }
    
    @PostMapping
    public ResponseEntity<WorkOrderDto> create(@RequestBody WorkOrderPayload payload) {
        WorkOrderDto created = workOrderService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    @PutMapping("/{id}")
    public WorkOrderDto update(@PathVariable String id, @RequestBody WorkOrderPayload payload) {
        return workOrderService.update(id, payload);
    }
    
    @PatchMapping("/{id}/status")
    public WorkOrderDto updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        WorkOrderStatus status = WorkOrderStatus.valueOf(body.get("status").toUpperCase());
        return workOrderService.updateStatus(id, status);
    }
    
    @GetMapping("/{id}/material-requirements")
    public List<MaterialRequirementDto> getMaterialRequirements(@PathVariable String id) {
        return workOrderService.getMaterialRequirements(id);
    }
    
    @GetMapping("/{id}/operations")
    public List<OperationDto> getOperations(@PathVariable String id) {
        return workOrderService.getOperations(id);
    }
    
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return workOrderService.getStats();
    }
}
```

### 2. WIPController

```java
@RestController
@RequestMapping("/api/production/wip")
public class WIPController {
    
    private final WIPService wipService;
    
    public WIPController(WIPService wipService) {
        this.wipService = wipService;
    }
    
    @GetMapping
    public List<WIPEventDto> list(
        @RequestParam(name = "workOrderId", required = false) String workOrderId,
        @RequestParam(name = "eventType", required = false) WIPEventType eventType,
        @RequestParam(name = "status", required = false) WIPStatus status,
        @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return wipService.list(workOrderId, eventType, status, from, to);
    }
    
    @PostMapping
    public ResponseEntity<WIPEventDto> create(@RequestBody WIPEventPayload payload) {
        WIPEventDto created = wipService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    @PostMapping("/{id}/hold")
    public WIPEventDto hold(@PathVariable String id, @RequestBody Map<String, String> body) {
        return wipService.hold(id, body.get("reason"));
    }
    
    @PostMapping("/{id}/release")
    public WIPEventDto release(@PathVariable String id, @RequestBody Map<String, String> body) {
        return wipService.release(id, body.get("reason"));
    }
    
    @GetMapping("/{id}/summary")
    public WIPSummaryDto getSummary(@PathVariable String id) {
        return wipService.getSummary(id);
    }
}
```

## Database Migration Design

### V6__create_production_tables.sql

```sql
-- Production Module Database Migration
-- Creates all tables for the Production module

-- Create production_work_orders table
CREATE TABLE IF NOT EXISTS production_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    product_item_id UUID NOT NULL,
    sales_order_id UUID,
    sales_order_line_id UUID,
    quantity INTEGER NOT NULL,
    completed_quantity INTEGER NOT NULL DEFAULT 0,
    scrap_quantity INTEGER NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    actual_start_date DATE,
    actual_end_date DATE,
    routing_id UUID,
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    estimated_cost DECIMAL(15,2),
    actual_cost DECIMAL(15,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_routings table
CREATE TABLE IF NOT EXISTS production_routings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routing_number VARCHAR(50) NOT NULL UNIQUE,
    product_item_id UUID NOT NULL,
    version VARCHAR(20) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(50) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    estimated_total_time DECIMAL(10,2),
    estimated_total_cost DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_operations table
CREATE TABLE IF NOT EXISTS production_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routing_id UUID NOT NULL REFERENCES production_routings(id),
    sequence_number INTEGER NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    work_center_id UUID NOT NULL,
    description VARCHAR(500),
    setup_time DECIMAL(10,2),
    run_time DECIMAL(10,2),
    machine_time DECIMAL(10,2),
    labor_time DECIMAL(10,2),
    estimated_cost DECIMAL(15,2),
    standard_rate DECIMAL(15,2),
    minimum_quantity INTEGER,
    maximum_quantity INTEGER,
    is_critical BOOLEAN NOT NULL DEFAULT false,
    quality_check_required BOOLEAN NOT NULL DEFAULT false,
    notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_wip_events table
CREATE TABLE IF NOT EXISTS production_wip_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES production_work_orders(id),
    operation_id UUID NOT NULL REFERENCES production_operations(id),
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    operator_id UUID,
    machine_id UUID,
    batch_number VARCHAR(100),
    hold_reason VARCHAR(200),
    release_reason VARCHAR(200),
    quality_remarks VARCHAR(500),
    scrap_reason VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_machine_capacity table
CREATE TABLE IF NOT EXISTS production_machine_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL,
    date DATE NOT NULL,
    shift_id UUID NOT NULL,
    available_hours DECIMAL(10,2) NOT NULL,
    planned_hours DECIMAL(10,2),
    utilized_hours DECIMAL(10,2),
    efficiency_percentage DECIMAL(5,2),
    status VARCHAR(50) NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_labor_capacity table
CREATE TABLE IF NOT EXISTS production_labor_capacity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    work_center_id UUID NOT NULL,
    date DATE NOT NULL,
    shift_id UUID NOT NULL,
    available_hours DECIMAL(10,2) NOT NULL,
    planned_hours DECIMAL(10,2),
    utilized_hours DECIMAL(10,2),
    efficiency_percentage DECIMAL(5,2),
    skill_level VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    notes VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_schedules table
CREATE TABLE IF NOT EXISTS production_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES production_work_orders(id),
    operation_id UUID NOT NULL REFERENCES production_operations(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    machine_id UUID,
    employee_id UUID,
    status VARCHAR(50) NOT NULL,
    schedule_type VARCHAR(50) NOT NULL,
    priority INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_material_issues table
CREATE TABLE IF NOT EXISTS production_material_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES production_work_orders(id),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    lot_id UUID REFERENCES inventory_lots(id),
    quantity DECIMAL(15,3) NOT NULL,
    issue_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    issued_by VARCHAR(100),
    issued_at TIMESTAMP WITH TIME ZONE,
    received_by VARCHAR(100),
    received_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create production_material_requirements table
CREATE TABLE IF NOT EXISTS production_material_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES production_work_orders(id),
    item_id UUID NOT NULL REFERENCES inventory_items(id),
    required_quantity DECIMAL(15,3) NOT NULL,
    issued_quantity DECIMAL(15,3) DEFAULT 0,
    remaining_quantity DECIMAL(15,3) NOT NULL,
    requirement_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wo_number ON production_work_orders(work_order_number);
CREATE INDEX IF NOT EXISTS idx_wo_status ON production_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_wo_product ON production_work_orders(product_item_id);
CREATE INDEX IF NOT EXISTS idx_wo_sales_order ON production_work_orders(sales_order_id);
CREATE INDEX IF NOT EXISTS idx_wo_priority ON production_work_orders(priority);
CREATE INDEX IF NOT EXISTS idx_wo_start_date ON production_work_orders(start_date);
CREATE INDEX IF NOT EXISTS idx_wo_end_date ON production_work_orders(end_date);

CREATE INDEX IF NOT EXISTS idx_routing_product ON production_routings(product_item_id);
CREATE INDEX IF NOT EXISTS idx_routing_status ON production_routings(status);
CREATE INDEX IF NOT EXISTS idx_routing_version ON production_routings(version);

CREATE INDEX IF NOT EXISTS idx_operation_routing ON production_operations(routing_id);
CREATE INDEX IF NOT EXISTS idx_operation_work_center ON production_operations(work_center_id);
CREATE INDEX IF NOT EXISTS idx_operation_sequence ON production_operations(sequence_number);

CREATE INDEX IF NOT EXISTS idx_wip_wo ON production_wip_events(work_order_id);
CREATE INDEX IF NOT EXISTS idx_wip_operation ON production_wip_events(operation_id);
CREATE INDEX IF NOT EXISTS idx_wip_type ON production_wip_events(event_type);
CREATE INDEX IF NOT EXISTS idx_wip_status ON production_wip_events(status);
CREATE INDEX IF NOT EXISTS idx_wip_timestamp ON production_wip_events(event_timestamp);

CREATE INDEX IF NOT EXISTS idx_machine_capacity_machine ON production_machine_capacity(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_capacity_date ON production_machine_capacity(date);
CREATE INDEX IF NOT EXISTS idx_machine_capacity_shift ON production_machine_capacity(shift_id);

CREATE INDEX IF NOT EXISTS idx_schedule_wo ON production_schedules(work_order_id);
CREATE INDEX IF NOT EXISTS idx_schedule_operation ON production_schedules(operation_id);
CREATE INDEX IF NOT EXISTS idx_schedule_machine ON production_schedules(machine_id);
CREATE INDEX IF NOT EXISTS idx_schedule_employee ON production_schedules(employee_id);
CREATE INDEX IF NOT EXISTS idx_schedule_start_time ON production_schedules(start_time);

CREATE INDEX IF NOT EXISTS idx_material_issue_wo ON production_material_issues(work_order_id);
CREATE INDEX IF NOT EXISTS idx_material_issue_item ON production_material_issues(item_id);
CREATE INDEX IF NOT EXISTS idx_material_issue_status ON production_material_issues(status);

CREATE INDEX IF NOT EXISTS idx_material_req_wo ON production_material_requirements(work_order_id);
CREATE INDEX IF NOT EXISTS idx_material_req_item ON production_material_requirements(item_id);
CREATE INDEX IF NOT EXISTS idx_material_req_status ON production_material_requirements(status);
CREATE INDEX IF NOT EXISTS idx_material_req_date ON production_material_requirements(requirement_date);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_production_work_orders_updated_at ON production_work_orders;
CREATE TRIGGER update_production_work_orders_updated_at 
    BEFORE UPDATE ON production_work_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_routings_updated_at ON production_routings;
CREATE TRIGGER update_production_routings_updated_at 
    BEFORE UPDATE ON production_routings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_operations_updated_at ON production_operations;
CREATE TRIGGER update_production_operations_updated_at 
    BEFORE UPDATE ON production_operations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_wip_events_updated_at ON production_wip_events;
CREATE TRIGGER update_production_wip_events_updated_at 
    BEFORE UPDATE ON production_wip_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_machine_capacity_updated_at ON production_machine_capacity;
CREATE TRIGGER update_production_machine_capacity_updated_at 
    BEFORE UPDATE ON production_machine_capacity 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_labor_capacity_updated_at ON production_labor_capacity;
CREATE TRIGGER update_production_labor_capacity_updated_at 
    BEFORE UPDATE ON production_labor_capacity 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_schedules_updated_at ON production_schedules;
CREATE TRIGGER update_production_schedules_updated_at 
    BEFORE UPDATE ON production_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_material_issues_updated_at ON production_material_issues;
CREATE TRIGGER update_production_material_issues_updated_at 
    BEFORE UPDATE ON production_material_issues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_material_requirements_updated_at ON production_material_requirements;
CREATE TRIGGER update_production_material_requirements_updated_at 
    BEFORE UPDATE ON production_material_requirements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Integration Points

### 1. Inventory Integration

- **Material Requirements**: Work orders generate material requirements that integrate with inventory management
- **Material Issues**: Production consumes materials from inventory with proper tracking
- **Stock Updates**: WIP movements update inventory stock levels in real-time
- **Lot Tracking**: Integration with inventory lot tracking for traceability

### 2. Sales Integration

- **Sales Order Linking**: Work orders link to sales orders for demand planning
- **Customer Information**: Access customer details from sales module
- **Delivery Scheduling**: Coordinate production schedules with sales delivery dates

### 3. Engineering Integration

- **BOM Integration**: Use engineering BOMs for material requirements
- **Routing Integration**: Use engineering routings for operations
- **Quality Integration**: Link to quality inspection templates and results

### 4. Warehouse Integration

- **Material Movement**: Coordinate with warehouse for material picking and issuing
- **Finished Goods**: Transfer completed products to warehouse inventory
- **Location Tracking**: Track WIP and finished goods locations

## API Endpoints

### Work Order Management

- `GET /api/production/work-orders` - List work orders with filters
- `GET /api/production/work-orders/{id}` - Get work order details
- `POST /api/production/work-orders` - Create new work order
- `PUT /api/production/work-orders/{id}` - Update work order
- `PATCH /api/production/work-orders/{id}/status` - Update work order status
- `DELETE /api/production/work-orders/{id}` - Delete work order
- `GET /api/production/work-orders/stats` - Get work order statistics

### Routing Management

- `GET /api/production/routings` - List routings
- `GET /api/production/routings/{id}` - Get routing details
- `POST /api/production/routings` - Create new routing
- `PUT /api/production/routings/{id}` - Update routing
- `GET /api/production/routings/{id}/operations` - Get routing operations

### WIP Tracking

- `GET /api/production/wip` - List WIP events
- `POST /api/production/wip` - Create WIP event
- `POST /api/production/wip/{id}/hold` - Hold WIP
- `POST /api/production/wip/{id}/release` - Release WIP
- `GET /api/production/wip/{id}/summary` - Get WIP summary

### Capacity Management

- `GET /api/production/capacity/machines` - Get machine capacity
- `GET /api/production/capacity/labor` - Get labor capacity
- `POST /api/production/capacity/machines` - Update machine capacity
- `POST /api/production/capacity/labor` - Update labor capacity

### Scheduling

- `GET /api/production/schedules` - List production schedules
- `POST /api/production/schedules` - Create production schedule
- `PUT /api/production/schedules/{id}` - Update schedule
- `DELETE /api/production/schedules/{id}` - Delete schedule

### Material Management

- `GET /api/production/material-requirements` - List material requirements
- `GET /api/production/material-issues` - List material issues
- `POST /api/production/material-issues` - Create material issue
- `POST /api/production/material-issues/{id}/receive` - Receive material

## Business Rules

### Work Order Rules

1. **Number Generation**: Auto-generate work order numbers with format "WO-YYYY-NNNN"
2. **Status Transitions**: Define valid status transitions (Draft → Planned → Released → In Progress → Completed)
3. **Date Validation**: End date must be after start date
4. **Quantity Validation**: Completed + Scrap ≤ Total Quantity
5. **Routing Assignment**: Work orders must have a valid routing
6. **Material Availability**: Check material availability before releasing to production

### WIP Rules

1. **Event Sequencing**: Operations must be completed in sequence
2. **Quantity Tracking**: Track quantities at each operation
3. **Hold/Release**: Proper authorization required for holds and releases
4. **Quality Integration**: Quality checks required for critical operations
5. **Time Tracking**: Track actual vs. estimated times

### Capacity Rules

1. **Resource Allocation**: Prevent double-booking of machines and labor
2. **Shift Management**: Respect shift schedules and breaks
3. **Efficiency Tracking**: Monitor and report on capacity utilization
4. **Maintenance Integration**: Account for planned maintenance downtime

### Material Rules

1. **Requirement Calculation**: Calculate material needs based on BOM and routing
2. **Issue Authorization**: Require proper authorization for material issues
3. **Lot Traceability**: Maintain lot traceability throughout production
4. **Scrap Tracking**: Track and analyze scrap rates

## Error Handling

### Validation Errors

- **Business Rule Violations**: Clear error messages for business rule violations
- **Data Integrity**: Handle constraint violations gracefully
- **Permission Errors**: Proper authorization checks

### Business Logic Errors

- **Resource Conflicts**: Handle scheduling conflicts
- **Material Shortages**: Alert when materials are insufficient
- **Capacity Overloads**: Prevent over-allocation of resources

### System Errors

- **Database Errors**: Handle connection and transaction errors
- **Integration Failures**: Graceful handling of external system failures
- **Audit Trail**: Log all errors for troubleshooting

This design document provides a comprehensive blueprint for implementing the production module, following established patterns while addressing the specific needs of production workflow management in a PCB manufacturing environment.