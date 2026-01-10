package com.pcbxpress.erp.modules.engineering.revisions.service;

import com.pcbxpress.erp.modules.engineering.revisions.dto.ECOChangeRequestDto;
import com.pcbxpress.erp.modules.engineering.revisions.dto.ECOChangeRequestPayload;
import com.pcbxpress.erp.modules.engineering.revisions.model.ECOChangeRequest;
import com.pcbxpress.erp.modules.engineering.revisions.model.ECOStatus;
import com.pcbxpress.erp.modules.engineering.revisions.repository.ECOChangeRequestRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ECOChangeRequestService {
    
    private final ECOChangeRequestRepository ecoChangeRequestRepository;
    
    public ECOChangeRequestService(ECOChangeRequestRepository ecoChangeRequestRepository) {
        this.ecoChangeRequestRepository = ecoChangeRequestRepository;
    }
    
    public List<ECOChangeRequestDto> list(String query, String changeType, String priority, UUID jobId, UUID requestedBy, UUID assignedTo, ECOStatus status) {
        List<ECOChangeRequest> requests = ecoChangeRequestRepository.findAll();
        
        if (query != null && !query.trim().isEmpty()) {
            String q = query.toLowerCase();
            requests = requests.stream()
                .filter(r -> matchesQuery(r, q))
                .collect(Collectors.toList());
        }
        
        if (changeType != null && !changeType.trim().isEmpty()) {
            requests = requests.stream()
                .filter(r -> r.getChangeType() != null && r.getChangeType().toLowerCase().contains(changeType.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        if (priority != null && !priority.trim().isEmpty()) {
            requests = requests.stream()
                .filter(r -> r.getPriority() != null && r.getPriority().toLowerCase().contains(priority.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        if (jobId != null) {
            requests = requests.stream()
                .filter(r -> r.getJobId() != null && r.getJobId().equals(jobId))
                .collect(Collectors.toList());
        }
        
        if (requestedBy != null) {
            requests = requests.stream()
                .filter(r -> r.getRequestedBy() != null && r.getRequestedBy().equals(requestedBy))
                .collect(Collectors.toList());
        }
        
        if (assignedTo != null) {
            requests = requests.stream()
                .filter(r -> r.getAssignedTo() != null && r.getAssignedTo().equals(assignedTo))
                .collect(Collectors.toList());
        }
        
        if (status != null) {
            requests = requests.stream()
                .filter(r -> r.getStatus() == status)
                .collect(Collectors.toList());
        }
        
        return requests.stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .map(ECOChangeRequestDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public ECOChangeRequestDto getById(UUID id) {
        ECOChangeRequest request = ecoChangeRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ECO change request not found: " + id));
        return ECOChangeRequestDto.fromEntity(request);
    }
    
    public ECOChangeRequestDto create(ECOChangeRequestPayload payload) {
        ECOChangeRequest request = new ECOChangeRequest();
        request.setId(UUID.randomUUID());
        request.setCreatedAt(OffsetDateTime.now());
        request.setUpdatedAt(OffsetDateTime.now());
        
        applyPayload(request, payload);
        
        // Set default status if not provided
        if (request.getStatus() == null) {
            request.setStatus(ECOStatus.DRAFT);
        }
        
        // Set default values
        if (!request.isActive()) {
            request.setActive(true);
        }
        
        ECOChangeRequest saved = ecoChangeRequestRepository.save(request);
        return ECOChangeRequestDto.fromEntity(saved);
    }
    
    public ECOChangeRequestDto update(UUID id, ECOChangeRequestPayload payload) {
        ECOChangeRequest existing = ecoChangeRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ECO change request not found: " + id));
        
        applyPayload(existing, payload);
        existing.setUpdatedAt(OffsetDateTime.now());
        
        ECOChangeRequest saved = ecoChangeRequestRepository.save(existing);
        return ECOChangeRequestDto.fromEntity(saved);
    }
    
    public void delete(UUID id) {
        ECOChangeRequest request = ecoChangeRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ECO change request not found: " + id));
        ecoChangeRequestRepository.delete(request);
    }
    
    public void deleteBulk(List<UUID> ids) {
        List<ECOChangeRequest> requests = ecoChangeRequestRepository.findAllById(ids);
        ecoChangeRequestRepository.deleteAll(requests);
    }
    
    public ECOChangeRequestDto updateStatus(UUID id, ECOStatus status) {
        ECOChangeRequest request = ecoChangeRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ECO change request not found: " + id));
        
        request.setStatus(status);
        request.setUpdatedAt(OffsetDateTime.now());
        
        ECOChangeRequest saved = ecoChangeRequestRepository.save(request);
        return ECOChangeRequestDto.fromEntity(saved);
    }
    
    public ECOChangeRequestDto submitForReview(UUID id) {
        ECOChangeRequest request = ecoChangeRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ECO change request not found: " + id));
        
        if (request.getStatus() != ECOStatus.DRAFT) {
            throw new RuntimeException("Only draft requests can be submitted for review");
        }
        
        request.setStatus(ECOStatus.SUBMITTED);
        request.setUpdatedAt(OffsetDateTime.now());
        
        ECOChangeRequest saved = ecoChangeRequestRepository.save(request);
        return ECOChangeRequestDto.fromEntity(saved);
    }
    
    public ECOChangeRequestDto approve(UUID id, UUID approvedBy, String approvedByName) {
        ECOChangeRequest request = ecoChangeRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ECO change request not found: " + id));
        
        if (request.getStatus() != ECOStatus.UNDER_REVIEW && request.getStatus() != ECOStatus.SUBMITTED) {
            throw new RuntimeException("Request must be under review to be approved");
        }
        
        request.setStatus(ECOStatus.APPROVED);
        request.setApprovedBy(approvedBy);
        request.setApprovedByName(approvedByName);
        request.setApprovedAt(OffsetDateTime.now());
        request.setUpdatedAt(OffsetDateTime.now());
        
        ECOChangeRequest saved = ecoChangeRequestRepository.save(request);
        return ECOChangeRequestDto.fromEntity(saved);
    }
    
    public ECOChangeRequestDto reject(UUID id, UUID rejectedBy, String rejectedByName, String rejectedReason) {
        ECOChangeRequest request = ecoChangeRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ECO change request not found: " + id));
        
        if (request.getStatus() != ECOStatus.UNDER_REVIEW && request.getStatus() != ECOStatus.SUBMITTED) {
            throw new RuntimeException("Request must be under review to be rejected");
        }
        
        request.setStatus(ECOStatus.REJECTED);
        request.setRejectedBy(rejectedBy);
        request.setRejectedByName(rejectedByName);
        request.setRejectedAt(OffsetDateTime.now());
        request.setRejectedReason(rejectedReason);
        request.setUpdatedAt(OffsetDateTime.now());
        
        ECOChangeRequest saved = ecoChangeRequestRepository.save(request);
        return ECOChangeRequestDto.fromEntity(saved);
    }
    
    public ECOChangeRequestDto implement(UUID id) {
        ECOChangeRequest request = ecoChangeRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ECO change request not found: " + id));
        
        if (request.getStatus() != ECOStatus.APPROVED) {
            throw new RuntimeException("Only approved requests can be implemented");
        }
        
        request.setStatus(ECOStatus.IMPLEMENTING);
        request.setUpdatedAt(OffsetDateTime.now());
        
        ECOChangeRequest saved = ecoChangeRequestRepository.save(request);
        return ECOChangeRequestDto.fromEntity(saved);
    }
    
    public ECOChangeRequestDto completeImplementation(UUID id) {
        ECOChangeRequest request = ecoChangeRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ECO change request not found: " + id));
        
        if (request.getStatus() != ECOStatus.IMPLEMENTING) {
            throw new RuntimeException("Only implementing requests can be completed");
        }
        
        request.setStatus(ECOStatus.IMPLEMENTED);
        request.setActualImplementationDate(OffsetDateTime.now());
        request.setUpdatedAt(OffsetDateTime.now());
        
        ECOChangeRequest saved = ecoChangeRequestRepository.save(request);
        return ECOChangeRequestDto.fromEntity(saved);
    }
    
    public ECOChangeRequestDto close(UUID id, UUID closedBy, String closedByName, String closureNotes) {
        ECOChangeRequest request = ecoChangeRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("ECO change request not found: " + id));
        
        if (request.getStatus() != ECOStatus.IMPLEMENTED) {
            throw new RuntimeException("Only implemented requests can be closed");
        }
        
        request.setStatus(ECOStatus.CLOSED);
        request.setClosedBy(closedBy);
        request.setClosedByName(closedByName);
        request.setClosedAt(OffsetDateTime.now());
        request.setClosureNotes(closureNotes);
        request.setUpdatedAt(OffsetDateTime.now());
        
        ECOChangeRequest saved = ecoChangeRequestRepository.save(request);
        return ECOChangeRequestDto.fromEntity(saved);
    }
    
    public List<ECOChangeRequestDto> getByJobId(UUID jobId) {
        return ecoChangeRequestRepository.findByJobId(jobId).stream()
            .map(ECOChangeRequestDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<ECOChangeRequestDto> getByRequestedBy(UUID requestedBy) {
        return ecoChangeRequestRepository.findByRequestedBy(requestedBy).stream()
            .map(ECOChangeRequestDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<ECOChangeRequestDto> getByAssignedTo(UUID assignedTo) {
        return ecoChangeRequestRepository.findByAssignedTo(assignedTo).stream()
            .map(ECOChangeRequestDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<ECOChangeRequestDto> getByStatus(ECOStatus status) {
        return ecoChangeRequestRepository.findByStatus(status).stream()
            .map(ECOChangeRequestDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<ECOChangeRequestDto> getOverdueRequests() {
        return ecoChangeRequestRepository.findOverdueRequests(
            List.of(ECOStatus.SUBMITTED, ECOStatus.UNDER_REVIEW, ECOStatus.IMPLEMENTING),
            OffsetDateTime.now()
        ).stream()
            .map(ECOChangeRequestDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public long countByStatus(ECOStatus status) {
        return ecoChangeRequestRepository.countByStatus(status);
    }
    
    public long countActive() {
        return ecoChangeRequestRepository.countActive();
    }
    
    public long countInactive() {
        return ecoChangeRequestRepository.countInactive();
    }
    
    private void applyPayload(ECOChangeRequest request, ECOChangeRequestPayload payload) {
        request.setChangeRequestNumber(payload.changeRequestNumber());
        request.setJobId(payload.jobId());
        request.setJobNumber(payload.jobNumber());
        request.setPartNumber(payload.partNumber());
        request.setRevision(payload.revision());
        request.setTitle(payload.title());
        request.setDescription(payload.description());
        request.setChangeType(payload.changeType());
        request.setReason(payload.reason());
        request.setImpactAnalysis(payload.impactAnalysis());
        request.setAffectedDocuments(payload.affectedDocuments());
        request.setAffectedParts(payload.affectedParts());
        request.setEstimatedCost(payload.estimatedCost());
        request.setEstimatedHours(payload.estimatedHours());
        request.setPriority(payload.priority());
        request.setRequestedBy(payload.requestedBy());
        request.setRequestedByName(payload.requestedByName());
        request.setAssignedTo(payload.assignedTo());
        request.setAssignedToName(payload.assignedToName());
        request.setDueDate(payload.dueDate());
        request.setTargetImplementationDate(payload.targetImplementationDate());
        request.setActualImplementationDate(payload.actualImplementationDate());
        request.setStatus(payload.status());
        request.setApprovedBy(payload.approvedBy());
        request.setApprovedByName(payload.approvedByName());
        request.setApprovedAt(payload.approvedAt());
        request.setRejectedBy(payload.rejectedBy());
        request.setRejectedByName(payload.rejectedByName());
        request.setRejectedAt(payload.rejectedAt());
        request.setRejectedReason(payload.rejectedReason());
        request.setClosedBy(payload.closedBy());
        request.setClosedByName(payload.closedByName());
        request.setClosedAt(payload.closedAt());
        request.setClosureNotes(payload.closureNotes());
        request.setVersion(payload.version());
        request.setActive(payload.isActive());
    }
    
    private boolean matchesQuery(ECOChangeRequest request, String query) {
        return request.getChangeRequestNumber().toLowerCase().contains(query) ||
               (request.getTitle() != null && request.getTitle().toLowerCase().contains(query)) ||
               (request.getDescription() != null && request.getDescription().toLowerCase().contains(query)) ||
               (request.getChangeType() != null && request.getChangeType().toLowerCase().contains(query)) ||
               (request.getPriority() != null && request.getPriority().toLowerCase().contains(query)) ||
               (request.getJobNumber() != null && request.getJobNumber().toLowerCase().contains(query)) ||
               (request.getPartNumber() != null && request.getPartNumber().toLowerCase().contains(query));
    }
}