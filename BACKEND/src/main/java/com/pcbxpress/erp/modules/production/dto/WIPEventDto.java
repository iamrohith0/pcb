package com.pcbxpress.erp.modules.production.dto;

import com.pcbxpress.erp.modules.production.model.WIPEvent;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for WIP Events
 */
public record WIPEventDto(
    String id,
    String workOrderId,
    String operationId,
    String batchId,
    WIPEvent.EventType eventType,
    WIPEvent.Status status,
    Integer quantity,
    Integer scrapQuantity,
    Integer reworkQuantity,
    String operatorId,
    String operatorName,
    String machineId,
    String machineName,
    OffsetDateTime startTime,
    OffsetDateTime endTime,
    BigDecimal durationMinutes,
    BigDecimal setupTimeMinutes,
    BigDecimal cycleTimeMinutes,
    BigDecimal yieldPercentage,
    String reworkReason,
    String holdReason,
    String releaseReason,
    String qualityNotes,
    String productionNotes,
    String inspectionResults,
    String materialConsumption,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}