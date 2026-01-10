package com.pcbxpress.erp.modules.inventory.stock.dto;

import com.pcbxpress.erp.modules.inventory.stock.model.Stock;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Stock
 */
public record StockDto(
    String id,
    String itemId,
    String warehouseId,
    String locationId,
    String lotId,
    String serialId,
    BigDecimal quantity,
    BigDecimal reservedQuantity,
    BigDecimal availableQuantity,
    BigDecimal onOrderQuantity,
    BigDecimal committedQuantity,
    Stock.StockStatus stockStatus,
    BigDecimal costPerUnit,
    BigDecimal totalValue,
    OffsetDateTime lastMovementDate,
    OffsetDateTime expirationDate,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}