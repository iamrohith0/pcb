package com.pcbxpress.erp.modules.sales.rfq.dto;

import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import java.time.LocalDate;
import java.util.List;

public record RfqPayload(
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
    List<String> attachments
) {
}
