package com.pcbxpress.erp.modules.sales.customer.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerDocumentDto(
    Long id,
    UUID customerId,
    String documentType,
    String documentName,
    String documentPath,
    Long fileSize,
    String fileType,
    String uploadedBy,
    OffsetDateTime uploadedAt,
    OffsetDateTime expiresAt,
    boolean isActive
) {
}