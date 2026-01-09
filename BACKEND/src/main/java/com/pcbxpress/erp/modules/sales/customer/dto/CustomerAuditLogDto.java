package com.pcbxpress.erp.modules.sales.customer.dto;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerAuditLogDto(
    Long id,
    UUID customerId,
    String action,
    JsonNode changedFields,
    JsonNode oldValues,
    JsonNode newValues,
    String changedBy,
    String ipAddress,
    String userAgent,
    OffsetDateTime createdAt
) {
}