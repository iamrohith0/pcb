package com.pcbxpress.erp.modules.sales.quotation.dto;

public record QuotationLineDto(
    String id,
    String description,
    String hsn,
    Integer qty,
    Double unitPrice,
    Double discountPct,
    Double cgst,
    Double sgst,
    Double igst,
    String spec
) {
}
