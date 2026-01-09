package com.pcbxpress.erp.modules.sales.quotation.dto;

import java.time.LocalDate;
import java.util.List;

public record QuotationPayload(
    String quoteNo,
    LocalDate quoteDate,
    LocalDate validUntil,
    String customerId,
    String rfqRef,
    String currency,
    String incoterms,
    String leadTime,
    String paymentTerms,
    String remarks,
    PcbSpecDto pcb,
    List<QuotationLineDto> lines,
    QuotationTotals totals,
    String status,
    String internalNote
) {
}
