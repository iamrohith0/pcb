package com.pcbxpress.erp.modules.production.dto;

import com.pcbxpress.erp.modules.production.model.WorkOrder;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for Work Orders
 */
public record WorkOrderDto(
    String id,
    String workOrderNumber,
    String customerPO,
    String itemCode,
    String itemDescription,
    Integer quantity,
    WorkOrder.WorkOrderStatus status,
    WorkOrder.Priority priority,
    String routingId,
    LocalDate startDate,
    LocalDate dueDate,
    LocalDate completedDate,
    Integer completedQuantity,
    Integer scrapQuantity,
    BigDecimal estimatedHours,
    BigDecimal actualHours,
    String routingNotes,
    String qualityNotes,
    String productionNotes,
    boolean isRush,
    boolean isCritical,
    String customerId,
    String salesOrderId,
    String projectId,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}