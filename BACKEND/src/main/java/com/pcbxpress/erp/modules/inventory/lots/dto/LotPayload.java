package com.pcbxpress.erp.modules.inventory.lots.dto;

import com.pcbxpress.erp.modules.inventory.lots.model.Lot;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Payload DTO for creating and updating Lots
 */
public record LotPayload(
    String lotNumber,
    String itemId,
    String supplierId,
    OffsetDateTime receivedDate,
    OffsetDateTime manufactureDate,
    OffsetDateTime expirationDate,
    BigDecimal quantityReceived,
    BigDecimal costPerUnit,
    Lot.LotStatus status,
    String storageLocation,
    String batchReference,
    String certificateOfAnalysis,
    Lot.QualityStatus qualityStatus,
    String quarantineReason,
    String parentLotId,
    String childLotIds,
    String notes
) {
}