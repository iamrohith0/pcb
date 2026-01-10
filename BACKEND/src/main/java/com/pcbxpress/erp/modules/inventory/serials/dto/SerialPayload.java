package com.pcbxpress.erp.modules.inventory.serials.dto;

import com.pcbxpress.erp.modules.inventory.serials.model.Serial;
import java.time.OffsetDateTime;

/**
 * Payload DTO for creating and updating Serials
 */
public record SerialPayload(
    String serialNumber,
    String itemId,
    String lotId,
    String workOrderId,
    OffsetDateTime receivedDate,
    OffsetDateTime manufactureDate,
    OffsetDateTime expirationDate,
    Serial.SerialStatus status,
    String storageLocation,
    String parentSerialId,
    String childSerialIds,
    String currentLocation,
    String currentWarehouseId,
    String currentWorkOrderId,
    Serial.QualityStatus qualityStatus,
    String quarantineReason,
    String testResults,
    String repairHistory,
    OffsetDateTime warrantyExpiryDate,
    String notes
) {
}