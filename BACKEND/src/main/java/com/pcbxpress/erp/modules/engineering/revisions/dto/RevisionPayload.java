package com.pcbxpress.erp.modules.engineering.revisions.dto;

import com.pcbxpress.erp.modules.engineering.revisions.model.RevisionStatus;
import java.time.OffsetDateTime;
import java.util.UUID;

public record RevisionPayload(
        UUID jobId,
        String jobNumber,
        String partNumber,
        String revision,
        OffsetDateTime revisionDate,
        String revisionDescription,
        String previousRevision,
        String nextRevision,
        UUID changeRequestId,
        String changeRequestNumber,
        UUID approvedBy,
        String approvedByName,
        OffsetDateTime approvedAt,
        OffsetDateTime effectiveDate,
        String implementationNotes,
        String documentReferences,
        String materialChanges,
        String processChanges,
        String testRequirements,
        Double costImpact,
        Double scheduleImpact,
        RevisionStatus status,
        Integer version,
        boolean isActive) {
}