package com.pcbxpress.erp.modules.sales.salesorder.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import java.time.LocalDate;
import java.util.List;

public record SalesOrderPayload(
    @JsonAlias({"order_no", "orderNo", "so_no", "soNo"}) String orderNo,
    @JsonAlias({"order_date", "orderDate"}) LocalDate orderDate,
    @JsonAlias({"customer_id", "customerId"}) String customerId,
    ContactDto contact,
    PoInfo po,
    JobInfo job,
    SalesOrderAddresses addresses,
    String notes,
    List<SalesOrderItemDto> items,
    SalesOrderTotalsDto totals,
    String status,
    String currency
) {
}
