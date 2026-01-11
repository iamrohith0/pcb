package com.pcbxpress.erp.modules.traceability.genealogy.dto;

import com.pcbxpress.erp.modules.traceability.genealogy.model.LotGenealogy;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Lot Genealogy
 */
public record LotGenealogyDto(
    String id,
    String parentLotId,
    String childLotId,
    String componentId,
    LotGenealogy.RelationshipType relationshipType,
    Integer quantityUsed,
    String unitOfMeasure,
    OffsetDateTime productionDate,
    String supplierId,
    String warehouseId,
    String location,
    boolean isActive,
    String notes,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}