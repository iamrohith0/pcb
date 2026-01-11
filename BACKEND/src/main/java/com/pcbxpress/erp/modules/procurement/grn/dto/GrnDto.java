package com.pcbxpress.erp.modules.procurement.grn.dto;

import com.pcbxpress.erp.modules.procurement.grn.model.GrnLine;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record GrnDto(
    String id,
    String grnNumber,
    OffsetDateTime grnDate,
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
    String status,
    BigDecimal totalQuantity,
    BigDecimal totalValue,
    String notes,
    boolean qcRequired,
    OffsetDateTime qcPassedAt,
    OffsetDateTime qcFailedAt,
    String qcRemarks,
    OffsetDateTime putawayCompletedAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    List<GrnLineDto> lines
) {
    public record GrnLineDto(
        String id,
        String poLineId,
        String itemId,
        String itemCode,
        String itemDescription,
        BigDecimal poQuantity,
        BigDecimal receivedQuantity,
        BigDecimal acceptedQuantity,
        BigDecimal rejectedQuantity,
        BigDecimal unitPrice,
        BigDecimal lineValue,
        String batchNumber,
        OffsetDateTime expiryDate,
        String qcStatus,
        String qcRemarks,
        String putawayLocation,
        OffsetDateTime putawayCompletedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {
    }
}