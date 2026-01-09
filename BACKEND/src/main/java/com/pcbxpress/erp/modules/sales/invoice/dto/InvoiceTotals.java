package com.pcbxpress.erp.modules.sales.invoice.dto;

public record InvoiceTotals(
    Double subTotal,
    Double discountTotal,
    Double taxableTotal,
    Double taxTotal,
    Double chargeTotal,
    Double tcs,
    Double rounding,
    Double grandTotal
) {
}
