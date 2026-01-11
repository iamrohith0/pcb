package com.pcbxpress.erp.modules.traceability.batch.dto;

import com.pcbxpress.erp.modules.traceability.batch.model.Batch;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Payload DTO for creating and updating Batch
 */
public record BatchPayload(
    String batchNumber,
    String itemId,
    OffsetDateTime productionDate,
    OffsetDateTime expiryDate,
    Integer quantity,
    Batch.BatchStatus status,
    String location,
    String warehouseId,
    String supplierId,
    String lotNumber,
    String serialStart,
    String serialEnd,
    BigDecimal weight,
    BigDecimal length,
    BigDecimal width,
    BigDecimal height,
    BigDecimal volume,
    boolean isActive,
    String notes
) {
}