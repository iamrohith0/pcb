package com.pcbxpress.erp.modules.inventory.adjustments.dto;

import com.pcbxpress.erp.modules.inventory.adjustments.model.Adjustment;
import java.math.BigDecimal;

/**
 * Payload DTO for creating and updating Adjustments
 */
public record AdjustmentPayload(
    String itemId,
    String warehouseId,
    String locationId,
    String lotId,
    String serialId,
    Adjustment.AdjustmentType adjustmentType,
    String adjustmentReason,
    BigDecimal quantityBefore,
    BigDecimal quantityAfter,
    BigDecimal costPerUnit,
    String approvedBy,
    String performedBy,
    String referenceDocument,
    String notes
) {
}