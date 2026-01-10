package com.pcbxpress.erp.modules.production.dto;

import com.pcbxpress.erp.modules.production.model.Routing;
import java.math.BigDecimal;

/**
 * Payload DTO for creating and updating Routings
 */
public record RoutingPayload(
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
    String safetyRequirements
) {
}