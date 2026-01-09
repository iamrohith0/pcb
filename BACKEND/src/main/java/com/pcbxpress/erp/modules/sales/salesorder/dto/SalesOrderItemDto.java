package com.pcbxpress.erp.modules.sales.salesorder.dto;

public record SalesOrderItemDto(
    String id,
    String sku,
    String description,
    Integer qty,
    String uom,
    Double unitPrice,
    Double taxPct,
    Integer leadTimeDays
) {
}
