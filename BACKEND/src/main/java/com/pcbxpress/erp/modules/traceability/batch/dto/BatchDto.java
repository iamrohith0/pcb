package com.pcbxpress.erp.modules.traceability.batch.dto;

import com.pcbxpress.erp.modules.traceability.batch.model.Batch;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Batch
 */
public record BatchDto(
    String id,
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
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}