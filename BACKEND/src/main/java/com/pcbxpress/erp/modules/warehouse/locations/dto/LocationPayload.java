package com.pcbxpress.erp.modules.warehouse.locations.dto;

import com.pcbxpress.erp.modules.warehouse.locations.model.Location;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Payload DTO for creating and updating Locations
 */
public record LocationPayload(
        String code,
        String name,
        String description,
        UUID warehouseId,
        String warehouseName,
        Location.LocationType locationType,
        Boolean isActive,
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
        Integer maxItemsPerLocation) {
}