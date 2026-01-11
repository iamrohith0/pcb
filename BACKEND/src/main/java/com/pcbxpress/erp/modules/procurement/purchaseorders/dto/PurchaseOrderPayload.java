package com.pcbxpress.erp.modules.procurement.purchaseorders.dto;

import com.pcbxpress.erp.modules.procurement.purchaseorders.model.PurchaseOrderLine;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderPayload(
    String supplierId,
    String supplierName,
    String supplierCode,
    String currency,
    BigDecimal exchangeRate,
    String paymentTerms,
    OffsetDateTime deliveryDate,
    String deliveryAddress,
    String notes,
    List<PurchaseOrderLinePayload> lines
) {
    public record PurchaseOrderLinePayload(
        String itemId,
        String itemCode,
        String itemDescription,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal discountPercent,
        BigDecimal taxPercent
    ) {
    }
}