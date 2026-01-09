package com.pcbxpress.erp.modules.sales.rfq.dto;

import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record RfqDto(
    String id,
    String rfqNo,
    LocalDate rfqDate,
    String status,
    String priority,
    CustomerSummary customer,
    String currency,
    Integer totalQty,
    Integer linesCount,
    Integer maxLayers,
    List<RfqLineDto> lines,
    String specialInstructions,
    List<String> attachments,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
