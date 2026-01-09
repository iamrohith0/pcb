package com.pcbxpress.erp.modules.sales.customer.dto;

import java.time.OffsetDateTime;

public record CustomerDocumentPayload(
    String documentType,
    String documentName,
    String documentPath,
    Long fileSize,
    String fileType,
    String uploadedBy,
    OffsetDateTime expiresAt
) {
}