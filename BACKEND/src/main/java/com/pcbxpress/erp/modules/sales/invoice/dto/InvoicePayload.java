package com.pcbxpress.erp.modules.sales.invoice.dto;

import com.pcbxpress.erp.modules.sales.common.AddressDto;
import java.time.LocalDate;
import java.util.List;

public record InvoicePayload(
    String invoiceNo,
    LocalDate invoiceDate,
    LocalDate dueDate,
    String customerId,
    String sourceType,
    String sourceOrderId,
    String currency,
    String placeOfSupply,
    AddressDto billing,
    AddressDto shipping,
    List<InvoiceItemDto> items,
    InvoiceCharges charges,
    Double tcsPct,
    Double rounding,
    String notes,
    String terms,
    InvoiceTotals totals
) {
}
