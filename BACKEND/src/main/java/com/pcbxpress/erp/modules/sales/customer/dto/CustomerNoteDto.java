package com.pcbxpress.erp.modules.sales.customer.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerNoteDto(
    Long id,
    UUID customerId,
    String noteType,
    String title,
    String content,
    String createdBy,
    OffsetDateTime createdAt
) {
}