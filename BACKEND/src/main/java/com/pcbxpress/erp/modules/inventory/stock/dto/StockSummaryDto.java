package com.pcbxpress.erp.modules.inventory.stock.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Summary DTO for Stock Dashboard
 */
public record StockSummaryDto(
    UUID itemId,
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