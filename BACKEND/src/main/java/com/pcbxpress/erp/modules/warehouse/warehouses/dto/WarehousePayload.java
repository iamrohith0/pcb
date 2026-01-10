package com.pcbxpress.erp.modules.warehouse.warehouses.dto;

import com.pcbxpress.erp.modules.warehouse.warehouses.model.Warehouse;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Payload DTO for creating and updating Warehouses
 */
public record WarehousePayload(
    String code,
    String name,
    String description,
    Warehouse.WarehouseType warehouseType,
    UUID plantId,
    String plantName,
    boolean isDefault,
    boolean isActive,
    String addressLine1,
    String addressLine2,
    String city,
    String state,
    String pincode,
    String country,
    String contactName,
    String contactPhone,
    BigDecimal totalCapacity,
    BigDecimal usedCapacity,
    String capacityUnit,
    BigDecimal areaSqM,
    boolean supportsSerialization,
    boolean supportsLotTracking,
    boolean supportsBulkStorage,
    boolean supportsTemperatureControl,
    String temperatureRange
) {
}