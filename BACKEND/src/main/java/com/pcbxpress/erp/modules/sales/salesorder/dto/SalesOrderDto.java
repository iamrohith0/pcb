package com.pcbxpress.erp.modules.sales.salesorder.dto;

import com.pcbxpress.erp.modules.sales.common.CustomerSummary;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record SalesOrderDto(
    String id,
    String orderNo,
    LocalDate orderDate,
    String status,
    String currency,
    String customerId,
    CustomerSummary customer,
    ContactDto contact,
    PoInfo po,
    JobInfo job,
    SalesOrderAddresses addresses,
    List<SalesOrderItemDto> items,
    SalesOrderTotalsDto totals,
    String notes,
    List<String> attachments,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
