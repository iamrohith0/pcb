package com.pcbxpress.erp.modules.engineering.revisions.dto;

import com.pcbxpress.erp.modules.engineering.revisions.model.ECOStatus;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ECOChangeRequestPayload(
        String changeRequestNumber,
        UUID jobId,
        String jobNumber,
        String partNumber,
        String revision,
        String title,
        String description,
        String changeType,
        String reason,
        String impactAnalysis,
        String affectedDocuments,
        String affectedParts,
        Double estimatedCost,
        Double estimatedHours,
        String priority,
        UUID requestedBy,
        String requestedByName,
        UUID assignedTo,
        String assignedToName,
        OffsetDateTime dueDate,
        OffsetDateTime targetImplementationDate,
        OffsetDateTime actualImplementationDate,
        ECOStatus status,
        UUID approvedBy,
        String approvedByName,
        OffsetDateTime approvedAt,
        UUID rejectedBy,
        String rejectedByName,
        OffsetDateTime rejectedAt,
        String rejectedReason,
        UUID closedBy,
        String closedByName,
        OffsetDateTime closedAt,
        String closureNotes,
        Integer version,
        boolean isActive) {
}