package com.pcbxpress.erp.modules.production.dto;

import com.pcbxpress.erp.modules.production.model.Operation;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Operations
 */
public record OperationDto(
    String id,
    String operationCode,
    String routingId,
    Integer sequenceNumber,
    String description,
    Operation.OperationType operationType,
    String machineType,
    String machineId,
    BigDecimal estimatedTime,
    BigDecimal setupTime,
    BigDecimal cycleTime,
    BigDecimal estimatedCost,
    BigDecimal laborRate,
    BigDecimal machineRate,
    boolean isCritical,
    boolean isInspection,
    boolean requiresTooling,
    String toolingCode,
    String setupInstructions,
    String operationInstructions,
    String qualityChecks,
    String safetyRequirements,
    String materialsRequired,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}