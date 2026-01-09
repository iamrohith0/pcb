package com.pcbxpress.erp.modules.sales.invoice.dto;

public record InvoiceItemDto(
    String id,
    String description,
    String hsn,
    Integer qty,
    String uom,
    Double unitPrice,
    Double discountPct,
    Double taxPct
) {
}
