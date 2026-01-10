package com.pcbxpress.erp.modules.engineering.revisions.dto;

import com.pcbxpress.erp.modules.engineering.revisions.model.Revision;
import com.pcbxpress.erp.modules.engineering.revisions.model.RevisionStatus;
import java.time.OffsetDateTime;
import java.util.UUID;

public record RevisionDto(
        UUID id,
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
        boolean isActive,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt) {
    
    public static RevisionDto fromEntity(Revision entity) {
        return new RevisionDto(
            entity.getId(),
            entity.getJobId(),
            entity.getJobNumber(),
            entity.getPartNumber(),
            entity.getRevision(),
            entity.getRevisionDate(),
            entity.getRevisionDescription(),
            entity.getPreviousRevision(),
            entity.getNextRevision(),
            entity.getChangeRequestId(),
            entity.getChangeRequestNumber(),
            entity.getApprovedBy(),
            entity.getApprovedByName(),
            entity.getApprovedAt(),
            entity.getEffectiveDate(),
            entity.getImplementationNotes(),
            entity.getDocumentReferences(),
            entity.getMaterialChanges(),
            entity.getProcessChanges(),
            entity.getTestRequirements(),
            entity.getCostImpact(),
            entity.getScheduleImpact(),
            entity.getStatus(),
            entity.getVersion(),
            entity.isActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt()
        );
    }
}