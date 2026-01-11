package com.pcbxpress.erp.modules.traceability.recall.dto;

import com.pcbxpress.erp.modules.traceability.recall.model.Recall;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Recall
 */
public record RecallDto(
    String id,
    String caseNumber,
    String productId,
    String batchId,
    String lotId,
    Recall.RecallType recallType,
    Recall.Severity severity,
    Recall.RecallStatus status,
    String reason,
    String description,
    Integer affectedQuantity,
    String affectedBatches,
    String affectedLots,
    OffsetDateTime initiatedDate,
    OffsetDateTime effectiveDate,
    OffsetDateTime completedDate,
    String initiatedBy,
    String approvedBy,
    boolean customerNotificationRequired,
    boolean regulatoryNotificationRequired,
    BigDecimal estimatedCost,
    BigDecimal actualCost,
    String notes,
    boolean isActive,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}