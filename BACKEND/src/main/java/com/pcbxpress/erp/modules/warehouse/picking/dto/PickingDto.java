package com.pcbxpress.erp.modules.warehouse.picking.dto;

import com.pcbxpress.erp.modules.warehouse.picking.model.Picking;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for Picking
 */
public record PickingDto(
    String id,
    String code,
    String description,
    UUID warehouseId,
    String warehouseName,
    UUID locationId,
    String locationCode,
    String locationName,
    UUID itemId,
    String itemCode,
    String itemName,
    UUID batchId,
    String batchCode,
    UUID serialId,
    String serialCode,
    UUID shipmentId,
    String shipmentCode,
    String workOrder,
    String customer,
    Picking.Priority priority,
    Picking.PickingStatus status,
    BigDecimal quantityRequested,
    BigDecimal quantityPicked,
    BigDecimal quantityConfirmed,
    String unitOfMeasure,
    Picking.PickingType pickingType,
    String assignedTo,
    String pickedBy,
    String confirmedBy,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    OffsetDateTime pickedAt,
    OffsetDateTime confirmedAt
) {
}