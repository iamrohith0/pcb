package com.pcbxpress.erp.modules.sales.customer.dto;

public record CustomerNotePayload(
    String noteType,
    String title,
    String content,
    String createdBy
) {
}