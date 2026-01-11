package com.pcbxpress.erp.modules.procurement.grn.dto;

import com.pcbxpress.erp.modules.procurement.grn.model.GrnLine;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record GrnPayload(
    String poId,
    String poNumber,
    String supplierId,
    String supplierName,
    String supplierCode,
    String warehouseId,
    String warehouseName,
    String vehicleNumber,
    String driverName,
    String driverContact,
    String receivedBy,
    OffsetDateTime receivedAt,
    String notes,
    boolean qcRequired,
    List<GrnLinePayload> lines
) {
    public record GrnLinePayload(
        String poLineId,
        String itemId,
        String itemCode,
        String itemDescription,
        BigDecimal receivedQuantity,
        BigDecimal unitPrice,
        String batchNumber,
        OffsetDateTime expiryDate,
        String qcStatus,
        String qcRemarks,
        String putawayLocation
    ) {
    }
}