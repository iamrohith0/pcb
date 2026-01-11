package com.pcbxpress.erp.modules.traceability.recall.service;

import com.pcbxpress.erp.modules.traceability.recall.dto.RecallDto;
import com.pcbxpress.erp.modules.traceability.recall.dto.RecallPayload;
import com.pcbxpress.erp.modules.traceability.recall.model.Recall;
import com.pcbxpress.erp.modules.traceability.recall.repository.RecallRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing Recall entities
 */
@Service
@Transactional
public class RecallService {
    
    private final RecallRepository recallRepository;
    
    public RecallService(RecallRepository recallRepository) {
        this.recallRepository = recallRepository;
    }
    
    /**
     * List recalls with optional filters
     */
    public List<RecallDto> list(String query, String productId, String batchId, String lotId,
                               Recall.RecallType recallType, Recall.Severity severity, 
                               Recall.RecallStatus status, Boolean isActive, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page != null ? page : 0, size != null ? size : 20);
        UUID productUUID = productId != null ? UUID.fromString(productId) : null;
        UUID batchUUID = batchId != null ? UUID.fromString(batchId) : null;
        UUID lotUUID = lotId != null ? UUID.fromString(lotId) : null;
        
        Page<Recall> recalls = recallRepository.findByCriteria(productUUID, batchUUID, lotUUID, 
            recallType, severity, status, isActive, query, pageable);
        
        return recalls.stream()
            .sorted(Comparator.comparing(Recall::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single recall by ID
     */
    public RecallDto get(String id) {
        Recall recall = recallRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Recall not found: " + id));
        return toDto(recall);
    }
    
    /**
     * Create a new recall
     */
    public RecallDto create(RecallPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Recall recall = new Recall();
        recall.setId(UUID.randomUUID());
        applyPayload(recall, payload);
        
        // Auto-generate case number if not provided
        if (recall.getCaseNumber() == null || recall.getCaseNumber().isBlank()) {
            recall.setCaseNumber(generateCaseNumber());
        }
        
        // Set default values
        if (recall.isActive() == false) {
            recall.setActive(true);
        }
        
        if (recall.getStatus() == null) {
            recall.setStatus(Recall.RecallStatus.INITIATED);
        }
        
        if (recall.getInitiatedDate() == null) {
            recall.setInitiatedDate(OffsetDateTime.now());
        }
        
        Recall saved = recallRepository.save(recall);
        return toDto(saved);
    }
    
    /**
     * Update an existing recall
     */
    public RecallDto update(String id, RecallPayload payload) {
        Recall existing = recallRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Recall not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Recall saved = recallRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a recall
     */
    public void delete(String id) {
        recallRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple recalls
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(RecallService::parseId).collect(Collectors.toList());
        recallRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search recalls by query
     */
    public List<RecallDto> search(String query) {
        return recallRepository.findByCriteria(null, null, null, null, null, null, null, query, PageRequest.of(0, 100)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Initiate a recall
     */
    public RecallDto initiateRecall(RecallPayload payload) {
        return create(payload);
    }
    
    /**
     * Get recall impact analysis
     */
    public Map<String, Object> getRecallImpact(String id) {
        Recall recall = recallRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Recall not found: " + id));
        
        // Calculate impact based on affected quantity and cost
        BigDecimal estimatedTotalCost = BigDecimal.ZERO;
        if (recall.getEstimatedCost() != null && recall.getAffectedQuantity() != null) {
            estimatedTotalCost = recall.getEstimatedCost().multiply(BigDecimal.valueOf(recall.getAffectedQuantity()));
        }
        
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("recall", toDto(recall));
        result.put("caseNumber", recall.getCaseNumber());
        result.put("recallType", recall.getRecallType());
        result.put("severity", recall.getSeverity());
        result.put("status", recall.getStatus());
        result.put("affectedQuantity", recall.getAffectedQuantity());
        result.put("affectedBatches", recall.getAffectedBatches());
        result.put("affectedLots", recall.getAffectedLots());
        result.put("estimatedCost", recall.getEstimatedCost());
        result.put("estimatedTotalCost", estimatedTotalCost);
        result.put("customerNotificationRequired", recall.isCustomerNotificationRequired());
        result.put("regulatoryNotificationRequired", recall.isRegulatoryNotificationRequired());
        result.put("initiatedDate", recall.getInitiatedDate());
        result.put("effectiveDate", recall.getEffectiveDate());
        result.put("completedDate", recall.getCompletedDate());
        return result;
    }
    
    /**
     * Get recall cases
     */
    public List<RecallDto> getRecallCases(String recallType, String severity, String status) {
        Recall.RecallType type = recallType != null ? Recall.RecallType.valueOf(recallType.toUpperCase()) : null;
        Recall.Severity sev = severity != null ? Recall.Severity.valueOf(severity.toUpperCase()) : null;
        Recall.RecallStatus stat = status != null ? Recall.RecallStatus.valueOf(status.toUpperCase()) : null;
        
        List<Recall> recalls;
        if (type != null && sev != null && stat != null) {
            recalls = recallRepository.findBySeverityAndStatus(sev, stat);
            recalls = recalls.stream()
                .filter(r -> r.getRecallType() == type)
                .collect(Collectors.toList());
        } else if (type != null) {
            recalls = recallRepository.findByRecallType(type);
        } else if (sev != null) {
            recalls = recallRepository.findBySeverity(sev);
        } else if (stat != null) {
            recalls = recallRepository.findByStatus(stat);
        } else {
            recalls = recallRepository.findActiveRecalls(List.of(
                Recall.RecallStatus.INITIATED,
                Recall.RecallStatus.IN_PROGRESS,
                Recall.RecallStatus.ON_HOLD
            ));
        }
        
        return recalls.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get recall reports
     */
    public Map<String, Object> getRecallReports(String dateRange, String severity, String status) {
        OffsetDateTime startDate = null;
        OffsetDateTime endDate = null;
        
        if (dateRange != null) {
            // Parse date range (this would need proper implementation based on your date format)
            // For now, using current date as example
            endDate = OffsetDateTime.now();
            startDate = endDate.minusMonths(6);
        }
        
        List<Recall> recalls;
        if (startDate != null && endDate != null) {
            recalls = recallRepository.findByDateRange(startDate, endDate, PageRequest.of(0, 1000)).getContent();
        } else {
            recalls = recallRepository.findAll();
        }
        
        // Filter by severity and status if provided
        if (severity != null) {
            Recall.Severity sev = Recall.Severity.valueOf(severity.toUpperCase());
            recalls = recalls.stream()
                .filter(r -> r.getSeverity() == sev)
                .collect(Collectors.toList());
        }
        
        if (status != null) {
            Recall.RecallStatus stat = Recall.RecallStatus.valueOf(status.toUpperCase());
            recalls = recalls.stream()
                .filter(r -> r.getStatus() == stat)
                .collect(Collectors.toList());
        }
        
        // Calculate statistics
        long total = recalls.size();
        long classI = recalls.stream().filter(r -> r.getSeverity() == Recall.Severity.CLASS_I).count();
        long classII = recalls.stream().filter(r -> r.getSeverity() == Recall.Severity.CLASS_II).count();
        long classIII = recalls.stream().filter(r -> r.getSeverity() == Recall.Severity.CLASS_III).count();
        long minor = recalls.stream().filter(r -> r.getSeverity() == Recall.Severity.MINOR).count();
        
        BigDecimal totalCost = recalls.stream()
            .map(r -> r.getActualCost() != null ? r.getActualCost() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.of(
            "totalRecalls", total,
            "classI", classI,
            "classII", classII,
            "classIII", classIII,
            "minor", minor,
            "totalCost", totalCost,
            "averageCost", total > 0 ? totalCost.divide(BigDecimal.valueOf(total), 2, BigDecimal.ROUND_HALF_UP) : BigDecimal.ZERO,
            "voluntaryRecalls", recalls.stream().filter(r -> r.getRecallType() == Recall.RecallType.VOLUNTARY).count(),
            "mandatedRecalls", recalls.stream().filter(r -> r.getRecallType() == Recall.RecallType.MANDATED).count()
        );
    }
    
    /**
     * Update recall status
     */
    public RecallDto updateStatus(String id, Recall.RecallStatus newStatus) {
        Recall recall = recallRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Recall not found: " + id));
        
        recall.setStatus(newStatus);
        
        // Update completion date if status is completed
        if (newStatus == Recall.RecallStatus.COMPLETED && recall.getCompletedDate() == null) {
            recall.setCompletedDate(OffsetDateTime.now());
        }
        
        Recall saved = recallRepository.save(recall);
        return toDto(saved);
    }
    
    /**
     * Get recall statistics
     */
    public Map<String, Object> getStats() {
        long total = recallRepository.count();
        long initiated = recallRepository.countByStatus(Recall.RecallStatus.INITIATED);
        long inProgress = recallRepository.countByStatus(Recall.RecallStatus.IN_PROGRESS);
        long completed = recallRepository.countByStatus(Recall.RecallStatus.COMPLETED);
        long cancelled = recallRepository.countByStatus(Recall.RecallStatus.CANCELLED);
        long onHold = recallRepository.countByStatus(Recall.RecallStatus.ON_HOLD);
        
        // Count by severity
        Map<Recall.Severity, Long> bySeverity = java.util.Arrays.stream(Recall.Severity.values())
            .collect(Collectors.toMap(
                severity -> severity,
                severity -> recallRepository.countBySeverity(severity)
            ));
        
        // Count by type
        Map<Recall.RecallType, Long> byType = java.util.Arrays.stream(Recall.RecallType.values())
            .collect(Collectors.toMap(
                type -> type,
                type -> recallRepository.countByRecallType(type)
            ));
        
        return Map.of(
            "total", total,
            "initiated", initiated,
            "inProgress", inProgress,
            "completed", completed,
            "cancelled", cancelled,
            "onHold", onHold,
            "bySeverity", bySeverity,
            "byType", byType
        );
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Recall not found: " + id);
        }
    }
    
    private static String generateCaseNumber() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "RECALL-" + token;
    }
    
    private void validateUniqueConstraints(RecallPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate case number
        if (payload.caseNumber() != null && !payload.caseNumber().isBlank()) {
            boolean exists = recallRepository.existsByCaseNumberIgnoreCaseAndIdNot(payload.caseNumber(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Case number already exists: " + payload.caseNumber());
            }
        }
    }
    
    private void applyPayload(Recall target, RecallPayload payload) {
        target.setCaseNumber(payload.caseNumber());
        target.setProductId(payload.productId() != null ? UUID.fromString(payload.productId()) : null);
        target.setBatchId(payload.batchId() != null ? UUID.fromString(payload.batchId()) : null);
        target.setLotId(payload.lotId() != null ? UUID.fromString(payload.lotId()) : null);
        target.setRecallType(payload.recallType());
        target.setSeverity(payload.severity());
        target.setStatus(payload.status());
        target.setReason(payload.reason());
        target.setDescription(payload.description());
        target.setAffectedQuantity(payload.affectedQuantity());
        target.setAffectedBatches(payload.affectedBatches());
        target.setAffectedLots(payload.affectedLots());
        target.setInitiatedDate(payload.initiatedDate());
        target.setEffectiveDate(payload.effectiveDate());
        target.setInitiatedBy(payload.initiatedBy());
        target.setApprovedBy(payload.approvedBy());
        target.setCustomerNotificationRequired(payload.customerNotificationRequired());
        target.setRegulatoryNotificationRequired(payload.regulatoryNotificationRequired());
        target.setEstimatedCost(payload.estimatedCost());
        target.setActualCost(payload.actualCost());
        target.setNotes(payload.notes());
        target.setActive(payload.isActive());
    }
    
    private RecallDto toDto(Recall recall) {
        return new RecallDto(
            recall.getId().toString(),
            recall.getCaseNumber(),
            recall.getProductId() != null ? recall.getProductId().toString() : null,
            recall.getBatchId() != null ? recall.getBatchId().toString() : null,
            recall.getLotId() != null ? recall.getLotId().toString() : null,
            recall.getRecallType(),
            recall.getSeverity(),
            recall.getStatus(),
            recall.getReason(),
            recall.getDescription(),
            recall.getAffectedQuantity(),
            recall.getAffectedBatches(),
            recall.getAffectedLots(),
            safeOffset(recall.getInitiatedDate()),
            safeOffset(recall.getEffectiveDate()),
            safeOffset(recall.getCompletedDate()),
            recall.getInitiatedBy(),
            recall.getApprovedBy(),
            recall.isCustomerNotificationRequired(),
            recall.isRegulatoryNotificationRequired(),
            recall.getEstimatedCost(),
            recall.getActualCost(),
            recall.getNotes(),
            recall.isActive(),
            safeOffset(recall.getCreatedAt()),
            safeOffset(recall.getUpdatedAt())
        );
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}