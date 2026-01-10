package com.pcbxpress.erp.modules.warehouse.locations.dto;

import com.pcbxpress.erp.modules.warehouse.locations.model.Location;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for Location
 */
public record LocationDto(
    String id,
    String code,
    String name,
    String description,
    UUID warehouseId,
    String warehouseName,
    Location.LocationType locationType,
    boolean isActive,
    String zone,
    String aisle,
    String rack,
    String shelf,
    String bin,
    BigDecimal maxCapacity,
    BigDecimal currentCapacity,
    String capacityUnit,
    BigDecimal length,
    BigDecimal width,
    BigDecimal height,
    BigDecimal volume,
    Location.LocationStatus status,
    boolean isLocked,
    boolean isQuarantine,
    boolean isBulkStorage,
    boolean supportsSerialization,
    boolean supportsLotTracking,
    String restrictedItemTypes,
    Integer maxItemsPerLocation,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}