package com.pcbxpress.erp.modules.sales.quotation.dto;

import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record QuotationDto(
    String id,
    String quoteNo,
    LocalDate quoteDate,
    LocalDate validUntil,
    String status,
    String currency,
    String incoterms,
    String leadTime,
    String paymentTerms,
    String remarks,
    String rfqRef,
    String customerId,
    CustomerSummary customer,
    PcbSpecDto pcb,
    List<QuotationLineDto> lines,
    QuotationTotals totals,
    String internalNote,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
