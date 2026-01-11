package com.pcbxpress.erp.modules.procurement.purchaseorders.dto;

import com.pcbxpress.erp.modules.procurement.purchaseorders.model.PurchaseOrderLine;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderDto(
    String id,
    String poNumber,
    OffsetDateTime poDate,
    String supplierId,
    String supplierName,
    String supplierCode,
    String status,
    String currency,
    BigDecimal exchangeRate,
    BigDecimal subtotal,
    BigDecimal discountAmount,
    BigDecimal taxAmount,
    BigDecimal shippingAmount,
    BigDecimal grandTotal,
    String paymentTerms,
    OffsetDateTime deliveryDate,
    String deliveryAddress,
    String notes,
    String approvedBy,
    OffsetDateTime approvedAt,
    OffsetDateTime sentToSupplierAt,
    OffsetDateTime receivedAt,
    OffsetDateTime closedAt,
    OffsetDateTime cancelledAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    List<PurchaseOrderLineDto> lines
) {
    public record PurchaseOrderLineDto(
        String id,
        String itemId,
        String itemCode,
        String itemDescription,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal discountPercent,
        BigDecimal discountAmount,
        BigDecimal taxPercent,
        BigDecimal taxAmount,
        BigDecimal lineTotal,
        BigDecimal receivedQuantity,
        BigDecimal pendingQuantity,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {
    }
}