package com.pcbxpress.erp.modules.production.dto;

import com.pcbxpress.erp.modules.production.model.WorkOrder;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Payload DTO for creating and updating Work Orders
 */
public record WorkOrderPayload(
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
    String projectId
) {
}