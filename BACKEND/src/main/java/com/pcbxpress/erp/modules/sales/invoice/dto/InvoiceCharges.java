package com.pcbxpress.erp.modules.sales.invoice.dto;

public record InvoiceCharges(
    Double packing,
    Double shipping,
    Double other
) {
}
