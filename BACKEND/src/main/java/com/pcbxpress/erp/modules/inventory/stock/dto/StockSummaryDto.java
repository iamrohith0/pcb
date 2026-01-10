package com.pcbxpress.erp.modules.inventory.stock.dto;

import java.math.BigDecimal;

/**
 * Summary DTO for Stock Dashboard
 */
public record StockSummaryDto(
    String itemId,
    String itemName,
    String itemCode,
    BigDecimal totalQuantity,
    BigDecimal totalReserved,
    BigDecimal totalAvailable,
    BigDecimal totalOnOrder,
    BigDecimal totalCommitted,
    BigDecimal totalValue,
    Long warehouseCount,
    Long locationCount
) {
}