package com.pcbxpress.erp.modules.inventory.adjustments.dto;

import com.pcbxpress.erp.modules.inventory.adjustments.model.Adjustment;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Adjustments
 */
public record AdjustmentDto(
    String id,
    String adjustmentNumber,
    String itemId,
    String warehouseId,
    String locationId,
    String lotId,
    String serialId,
    Adjustment.AdjustmentType adjustmentType,
    String adjustmentReason,
    BigDecimal quantityBefore,
    BigDecimal quantityAfter,
    BigDecimal quantityDifference,
    BigDecimal costPerUnit,
    BigDecimal totalValue,
    Adjustment.AdjustmentStatus status,
    String approvedBy,
    OffsetDateTime approvedAt,
    String performedBy,
    OffsetDateTime performedAt,
    String referenceDocument,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}