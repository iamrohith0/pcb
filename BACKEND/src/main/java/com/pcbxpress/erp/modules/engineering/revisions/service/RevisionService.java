package com.pcbxpress.erp.modules.engineering.revisions.service;

import com.pcbxpress.erp.modules.engineering.revisions.dto.RevisionDto;
import com.pcbxpress.erp.modules.engineering.revisions.dto.RevisionPayload;
import com.pcbxpress.erp.modules.engineering.revisions.model.Revision;
import com.pcbxpress.erp.modules.engineering.revisions.model.RevisionStatus;
import com.pcbxpress.erp.modules.engineering.revisions.repository.RevisionRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RevisionService {
    
    private final RevisionRepository revisionRepository;
    
    public RevisionService(RevisionRepository revisionRepository) {
        this.revisionRepository = revisionRepository;
    }
    
    public List<RevisionDto> list(String query, String partNumber, String revision, UUID jobId, UUID changeRequestId, RevisionStatus status) {
        List<Revision> revisions = revisionRepository.findAll();
        
        if (query != null && !query.trim().isEmpty()) {
            String q = query.toLowerCase();
            revisions = revisions.stream()
                .filter(r -> matchesQuery(r, q))
                .collect(Collectors.toList());
        }
        
        if (partNumber != null && !partNumber.trim().isEmpty()) {
            revisions = revisions.stream()
                .filter(r -> r.getPartNumber() != null && r.getPartNumber().toLowerCase().contains(partNumber.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        if (revision != null && !revision.trim().isEmpty()) {
            revisions = revisions.stream()
                .filter(r -> r.getRevision() != null && r.getRevision().toLowerCase().contains(revision.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        if (jobId != null) {
            revisions = revisions.stream()
                .filter(r -> r.getJobId() != null && r.getJobId().equals(jobId))
                .collect(Collectors.toList());
        }
        
        if (changeRequestId != null) {
            revisions = revisions.stream()
                .filter(r -> r.getChangeRequestId() != null && r.getChangeRequestId().equals(changeRequestId))
                .collect(Collectors.toList());
        }
        
        if (status != null) {
            revisions = revisions.stream()
                .filter(r -> r.getStatus() == status)
                .collect(Collectors.toList());
        }
        
        return revisions.stream()
            .sorted((a, b) -> b.getRevisionDate().compareTo(a.getRevisionDate()))
            .map(RevisionDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public RevisionDto getById(UUID id) {
        Revision revision = revisionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Revision not found: " + id));
        return RevisionDto.fromEntity(revision);
    }
    
    public RevisionDto create(RevisionPayload payload) {
        Revision revision = new Revision();
        revision.setId(UUID.randomUUID());
        revision.setCreatedAt(OffsetDateTime.now());
        revision.setUpdatedAt(OffsetDateTime.now());
        
        applyPayload(revision, payload);
        
        // Set default status if not provided
        if (revision.getStatus() == null) {
            revision.setStatus(RevisionStatus.DRAFT);
        }
        
        // Set default values
        if (!revision.isActive()) {
            revision.setActive(true);
        }
        
        Revision saved = revisionRepository.save(revision);
        return RevisionDto.fromEntity(saved);
    }
    
    public RevisionDto update(UUID id, RevisionPayload payload) {
        Revision existing = revisionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Revision not found: " + id));
        
        applyPayload(existing, payload);
        existing.setUpdatedAt(OffsetDateTime.now());
        
        Revision saved = revisionRepository.save(existing);
        return RevisionDto.fromEntity(saved);
    }
    
    public void delete(UUID id) {
        Revision revision = revisionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Revision not found: " + id));
        revisionRepository.delete(revision);
    }
    
    public void deleteBulk(List<UUID> ids) {
        List<Revision> revisions = revisionRepository.findAllById(ids);
        revisionRepository.deleteAll(revisions);
    }
    
    public RevisionDto updateStatus(UUID id, RevisionStatus status) {
        Revision revision = revisionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Revision not found: " + id));
        
        revision.setStatus(status);
        revision.setUpdatedAt(OffsetDateTime.now());
        
        Revision saved = revisionRepository.save(revision);
        return RevisionDto.fromEntity(saved);
    }
    
    public RevisionDto approve(UUID id, UUID approvedBy, String approvedByName) {
        Revision revision = revisionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Revision not found: " + id));
        
        if (revision.getStatus() != RevisionStatus.DRAFT && revision.getStatus() != RevisionStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Only draft or pending approval revisions can be approved");
        }
        
        revision.setStatus(RevisionStatus.APPROVED);
        revision.setApprovedBy(approvedBy);
        revision.setApprovedByName(approvedByName);
        revision.setApprovedAt(OffsetDateTime.now());
        revision.setUpdatedAt(OffsetDateTime.now());
        
        Revision saved = revisionRepository.save(revision);
        return RevisionDto.fromEntity(saved);
    }
    
    public RevisionDto implement(UUID id) {
        Revision revision = revisionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Revision not found: " + id));
        
        if (revision.getStatus() != RevisionStatus.APPROVED) {
            throw new RuntimeException("Only approved revisions can be implemented");
        }
        
        revision.setStatus(RevisionStatus.IMPLEMENTED);
        revision.setEffectiveDate(OffsetDateTime.now());
        revision.setUpdatedAt(OffsetDateTime.now());
        
        Revision saved = revisionRepository.save(revision);
        return RevisionDto.fromEntity(saved);
    }
    
    public RevisionDto obsolete(UUID id) {
        Revision revision = revisionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Revision not found: " + id));
        
        revision.setStatus(RevisionStatus.OBSOLETE);
        revision.setUpdatedAt(OffsetDateTime.now());
        
        Revision saved = revisionRepository.save(revision);
        return RevisionDto.fromEntity(saved);
    }
    
    public RevisionDto archive(UUID id) {
        Revision revision = revisionRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Revision not found: " + id));
        
        revision.setStatus(RevisionStatus.ARCHIVED);
        revision.setUpdatedAt(OffsetDateTime.now());
        
        Revision saved = revisionRepository.save(revision);
        return RevisionDto.fromEntity(saved);
    }
    
    public List<RevisionDto> getByJobId(UUID jobId) {
        return revisionRepository.findByJobId(jobId).stream()
            .map(RevisionDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<RevisionDto> getByPartNumber(String partNumber) {
        return revisionRepository.findByPartNumberOrderByRevisionDateDesc(partNumber).stream()
            .map(RevisionDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<RevisionDto> getByPartNumberAndStatus(String partNumber, RevisionStatus status) {
        return revisionRepository.findByPartNumberAndStatusOrderByRevisionDateDesc(partNumber, status).stream()
            .map(RevisionDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<RevisionDto> getByChangeRequestId(UUID changeRequestId) {
        return revisionRepository.findByChangeRequestIdOrderByCreatedAtDesc(changeRequestId).stream()
            .map(RevisionDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public RevisionDto getLatestRevisionByPartNumber(String partNumber) {
        Revision revision = revisionRepository.findLatestRevisionByPartNumber(partNumber);
        return revision != null ? RevisionDto.fromEntity(revision) : null;
    }
    
    public RevisionDto getLatestRevisionByPartNumberAndStatus(String partNumber, RevisionStatus status) {
        Revision revision = revisionRepository.findLatestRevisionByPartNumberAndStatus(partNumber, status);
        return revision != null ? RevisionDto.fromEntity(revision) : null;
    }
    
    public List<RevisionDto> getActiveRevisions() {
        return revisionRepository.findByIsActiveTrue().stream()
            .map(RevisionDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<RevisionDto> getInactiveRevisions() {
        return revisionRepository.findByIsActiveFalse().stream()
            .map(RevisionDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public long countByStatus(RevisionStatus status) {
        return revisionRepository.countByStatus(status);
    }
    
    public long countActive() {
        return revisionRepository.countActive();
    }
    
    public long countInactive() {
        return revisionRepository.countInactive();
    }
    
    private void applyPayload(Revision revision, RevisionPayload payload) {
        revision.setJobId(payload.jobId());
        revision.setJobNumber(payload.jobNumber());
        revision.setPartNumber(payload.partNumber());
        revision.setRevision(payload.revision());
        revision.setRevisionDate(payload.revisionDate());
        revision.setRevisionDescription(payload.revisionDescription());
        revision.setPreviousRevision(payload.previousRevision());
        revision.setNextRevision(payload.nextRevision());
        revision.setChangeRequestId(payload.changeRequestId());
        revision.setChangeRequestNumber(payload.changeRequestNumber());
        revision.setApprovedBy(payload.approvedBy());
        revision.setApprovedByName(payload.approvedByName());
        revision.setApprovedAt(payload.approvedAt());
        revision.setEffectiveDate(payload.effectiveDate());
        revision.setImplementationNotes(payload.implementationNotes());
        revision.setDocumentReferences(payload.documentReferences());
        revision.setMaterialChanges(payload.materialChanges());
        revision.setProcessChanges(payload.processChanges());
        revision.setTestRequirements(payload.testRequirements());
        revision.setCostImpact(payload.costImpact());
        revision.setScheduleImpact(payload.scheduleImpact());
        revision.setStatus(payload.status());
        revision.setVersion(payload.version());
        revision.setActive(payload.isActive());
    }
    
    private boolean matchesQuery(Revision revision, String query) {
        return revision.getPartNumber().toLowerCase().contains(query) ||
               (revision.getRevision() != null && revision.getRevision().toLowerCase().contains(query)) ||
               (revision.getRevisionDescription() != null && revision.getRevisionDescription().toLowerCase().contains(query)) ||
               (revision.getJobNumber() != null && revision.getJobNumber().toLowerCase().contains(query)) ||
               (revision.getChangeRequestNumber() != null && revision.getChangeRequestNumber().toLowerCase().contains(query)) ||
               (revision.getImplementationNotes() != null && revision.getImplementationNotes().toLowerCase().contains(query));
    }
}