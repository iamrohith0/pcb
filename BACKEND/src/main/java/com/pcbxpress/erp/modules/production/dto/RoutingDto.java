package com.pcbxpress.erp.modules.production.dto;

import com.pcbxpress.erp.modules.production.model.Routing;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Routings
 */
public record RoutingDto(
    String id,
    String routingCode,
    String itemCode,
    String description,
    Integer version,
    Routing.RoutingStatus status,
    BigDecimal estimatedTotalTime,
    BigDecimal estimatedTotalCost,
    boolean isActive,
    boolean isDefault,
    String revisionNotes,
    String engineeringNotes,
    String qualityRequirements,
    String safetyRequirements,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}