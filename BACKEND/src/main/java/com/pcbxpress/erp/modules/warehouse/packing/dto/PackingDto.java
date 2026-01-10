package com.pcbxpress.erp.modules.warehouse.packing.dto;

import com.pcbxpress.erp.modules.warehouse.packing.model.Packing;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for Packing
 */
public record PackingDto(
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
    UUID pickListId,
    String pickListCode,
    String customer,
    Packing.Priority priority,
    Packing.PackingStatus status,
    BigDecimal quantityToPack,
    BigDecimal quantityPacked,
    BigDecimal quantityConfirmed,
    String unitOfMeasure,
    Packing.PackingType packingType,
    String cartonType,
    String cartonCode,
    Integer cartonQuantity,
    BigDecimal weight,
    String weightUnit,
    BigDecimal dimensionsLength,
    BigDecimal dimensionsWidth,
    BigDecimal dimensionsHeight,
    String dimensionsUnit,
    String assignedTo,
    String packedBy,
    String confirmedBy,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    OffsetDateTime packedAt,
    OffsetDateTime confirmedAt
) {
}