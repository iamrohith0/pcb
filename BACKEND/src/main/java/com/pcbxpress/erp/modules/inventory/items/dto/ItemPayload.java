package com.pcbxpress.erp.modules.inventory.items.dto;

import com.pcbxpress.erp.modules.inventory.items.model.Item;
import java.math.BigDecimal;

/**
 * Payload DTO for creating and updating Inventory Items
 */
public record ItemPayload(
    String itemCode,
    String name,
    String description,
    String sku,
    String category,
    String subcategory,
    Item.ItemType itemType,
    String unitOfMeasure,
    Integer reorderLevel,
    Integer reorderQuantity,
    Integer minStockLevel,
    Integer maxStockLevel,
    BigDecimal costPrice,
    BigDecimal sellingPrice,
    BigDecimal weight,
    BigDecimal length,
    BigDecimal width,
    BigDecimal height,
    BigDecimal volume,
    boolean isActive,
    boolean isSerialized,
    boolean isLotTracked,
    Integer shelfLifeDays,
    boolean hazardousMaterial,
    String storageConditions,
    String supplierPartNumber,
    String manufacturer,
    String manufacturerPartNumber,
    String barcode,
    String notes
) {
}