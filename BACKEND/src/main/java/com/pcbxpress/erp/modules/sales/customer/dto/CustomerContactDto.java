package com.pcbxpress.erp.modules.sales.customer.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerContactDto(
    Long id,
    UUID customerId,
    String name,
    String email,
    String phone,
    String designation,
    String department,
    boolean isPrimary,
    boolean isBillingContact,
    boolean isShippingContact,
    boolean isTechnicalContact,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}