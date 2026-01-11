package com.pcbxpress.erp.modules.procurement.pricing.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record SupplierPricingPayload(
    String supplierId,
    String supplierName,
    String supplierCode,
    String itemId,
    String itemCode,
    String itemDescription,
    String currency,
    BigDecimal unitPrice,
    BigDecimal moq,
    Integer leadTimeDays,
    OffsetDateTime effectiveDate,
    OffsetDateTime expiryDate,
    String status,
    String notes,
    String approvedBy
) {
}