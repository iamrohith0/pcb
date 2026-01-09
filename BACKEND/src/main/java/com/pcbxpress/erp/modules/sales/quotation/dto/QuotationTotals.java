package com.pcbxpress.erp.modules.sales.quotation.dto;

public record QuotationTotals(
    Double subTotal,
    Double discountTotal,
    Double taxTotal,
    Double grandTotal
) {
}
