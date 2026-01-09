package com.pcbxpress.erp.modules.sales.invoice.dto;

import com.pcbxpress.erp.modules.sales.common.AddressDto;
import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record InvoiceDto(
    String id,
    String invoiceNo,
    LocalDate invoiceDate,
    LocalDate dueDate,
    String status,
    String customerId,
    CustomerSummary customer,
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
    InvoiceTotals totals,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
