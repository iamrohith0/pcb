package com.pcbxpress.erp.modules.inventory.bom.dto;

import com.pcbxpress.erp.modules.inventory.bom.model.Bom;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for BOMs
 */
public record BomDto(
    String id,
    String bomNumber,
    String productItemId,
    String revision,
    String version,
    String description,
    Bom.BomStatus status,
    OffsetDateTime effectiveDate,
    OffsetDateTime endDate,
    String unitOfMeasure,
    BigDecimal quantityPerUnit,
    Integer assemblyLevel,
    String engineer,
    String approver,
    OffsetDateTime approvedDate,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}