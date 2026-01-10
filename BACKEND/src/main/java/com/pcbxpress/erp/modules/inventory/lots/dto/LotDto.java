package com.pcbxpress.erp.modules.inventory.lots.dto;

import com.pcbxpress.erp.modules.inventory.lots.model.Lot;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Lots
 */
public record LotDto(
    String id,
    String lotNumber,
    String itemId,
    String supplierId,
    OffsetDateTime receivedDate,
    OffsetDateTime manufactureDate,
    OffsetDateTime expirationDate,
    BigDecimal quantityReceived,
    BigDecimal quantityAvailable,
    BigDecimal quantityUsed,
    BigDecimal quantityScrapped,
    BigDecimal costPerUnit,
    BigDecimal totalCost,
    Lot.LotStatus status,
    String storageLocation,
    String batchReference,
    String certificateOfAnalysis,
    Lot.QualityStatus qualityStatus,
    String quarantineReason,
    String parentLotId,
    String childLotIds,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}