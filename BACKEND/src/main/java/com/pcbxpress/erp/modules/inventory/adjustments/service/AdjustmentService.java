package com.pcbxpress.erp.modules.inventory.adjustments.service;

import com.pcbxpress.erp.modules.inventory.adjustments.dto.AdjustmentDto;
import com.pcbxpress.erp.modules.inventory.adjustments.dto.AdjustmentPayload;
import com.pcbxpress.erp.modules.inventory.adjustments.model.Adjustment;
import com.pcbxpress.erp.modules.inventory.adjustments.repository.AdjustmentRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for Adjustment Management
 */
@Service
@Transactional
public class AdjustmentService {
    
    private final AdjustmentRepository adjustmentRepository;
    
    public AdjustmentService(AdjustmentRepository adjustmentRepository) {
        this.adjustmentRepository = adjustmentRepository;
    }
    
    /**
     * List adjustments with optional filters
     */
    public List<AdjustmentDto> list(String query, String status, String type, String itemId, String warehouseId) {
        List<Adjustment> adjustments = adjustmentRepository.findAll();
        
        // Apply filters
        if (query != null && !query.isBlank()) {
            adjustments = adjustments.stream()
                .filter(adjustment -> matchesQuery(adjustment, query))
                .collect(Collectors.toList());
        }
        
        if (status != null && !status.isBlank()) {
            Adjustment.AdjustmentStatus adjStatus = Adjustment.AdjustmentStatus.valueOf(status.toUpperCase());
            adjustments = adjustments.stream()
                .filter(adjustment -> adjustment.getStatus() == adjStatus)
                .collect(Collectors.toList());
        }
        
        if (type != null && !type.isBlank()) {
            Adjustment.AdjustmentType adjType = Adjustment.AdjustmentType.valueOf(type.toUpperCase());
            adjustments = adjustments.stream()
                .filter(adjustment -> adjustment.getAdjustmentType() == adjType)
                .collect(Collectors.toList());
        }
        
        if (itemId != null && !itemId.isBlank()) {
            UUID itemUUID = UUID.fromString(itemId);
            adjustments = adjustments.stream()
                .filter(adjustment -> adjustment.getItemId().equals(itemUUID))
                .collect(Collectors.toList());
        }
        
        if (warehouseId != null && !warehouseId.isBlank()) {
            UUID warehouseUUID = UUID.fromString(warehouseId);
            adjustments = adjustments.stream()
                .filter(adjustment -> adjustment.getWarehouseId().equals(warehouseUUID))
                .collect(Collectors.toList());
        }
        
        return adjustments.stream()
            .sorted(Comparator.comparing(Adjustment::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single adjustment by ID
     */
    public AdjustmentDto get(String id) {
        Adjustment adjustment = adjustmentRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Adjustment not found: " + id));
        return toDto(adjustment);
    }
    
    /**
     * Create a new adjustment
     */
    public AdjustmentDto create(AdjustmentPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Adjustment adjustment = new Adjustment();
        adjustment.setId(UUID.randomUUID());
        applyPayload(adjustment, payload);
        
        // Auto-generate adjustment number if not provided
        if (adjustment.getAdjustmentNumber() == null || adjustment.getAdjustmentNumber().isBlank()) {
            adjustment.setAdjustmentNumber(generateAdjustmentNumber());
        }
        
        // Set default status
        if (adjustment.getStatus() == null) {
            adjustment.setStatus(Adjustment.AdjustmentStatus.DRAFT);
        }
        
        // Set creation timestamp
        if (adjustment.getPerformedAt() == null) {
            adjustment.setPerformedAt(OffsetDateTime.now());
        }
        
        Adjustment saved = adjustmentRepository.save(adjustment);
        return toDto(saved);
    }
    
    /**
     * Update an existing adjustment
     */
    public AdjustmentDto update(String id, AdjustmentPayload payload) {
        Adjustment existing = adjustmentRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Adjustment not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Adjustment saved = adjustmentRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete an adjustment
     */
    public void delete(String id) {
        adjustmentRepository.deleteById(UUID.fromString(id));
    }
    
    /**
     * Approve an adjustment
     */
    public AdjustmentDto approve(String id, String approvedBy) {
        Adjustment adjustment = adjustmentRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Adjustment not found: " + id));
        
        adjustment.setStatus(Adjustment.AdjustmentStatus.APPROVED);
        adjustment.setApprovedBy(approvedBy);
        adjustment.setApprovedAt(OffsetDateTime.now());
        
        // Update status to completed if approved
        if (adjustment.getStatus() == Adjustment.AdjustmentStatus.APPROVED) {
            adjustment.setStatus(Adjustment.AdjustmentStatus.COMPLETED);
        }
        
        Adjustment saved = adjustmentRepository.save(adjustment);
        return toDto(saved);
    }
    
    /**
     * Reject an adjustment
     */
    public AdjustmentDto reject(String id, String rejectedBy, String reason) {
        Adjustment adjustment = adjustmentRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("Adjustment not found: " + id));
        
        adjustment.setStatus(Adjustment.AdjustmentStatus.REJECTED);
        adjustment.setApprovedBy(rejectedBy);
        adjustment.setApprovedAt(OffsetDateTime.now());
        adjustment.setNotes(reason);
        
        Adjustment saved = adjustmentRepository.save(adjustment);
        return toDto(saved);
    }
    
    /**
     * Search adjustments
     */
    public List<AdjustmentDto> search(String query) {
        return adjustmentRepository.findAll().stream()
            .filter(adjustment -> matchesQuery(adjustment, query))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get adjustments by item
     */
    public List<AdjustmentDto> getByItem(String itemId, int limit) {
        List<Adjustment> adjustments = adjustmentRepository.findByItemId(UUID.fromString(itemId));
        return adjustments.stream()
            .limit(limit)
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get adjustments by warehouse
     */
    public List<AdjustmentDto> getByWarehouse(String warehouseId, int limit) {
        List<Adjustment> adjustments = adjustmentRepository.findByWarehouseId(UUID.fromString(warehouseId));
        return adjustments.stream()
            .limit(limit)
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get adjustment statistics
     */
    public Map<String, Object> getStats() {
        List<Adjustment> all = adjustmentRepository.findAll();
        long total = all.size();
        long draft = all.stream().filter(a -> a.getStatus() == Adjustment.AdjustmentStatus.DRAFT).count();
        long pending = all.stream().filter(a -> a.getStatus() == Adjustment.AdjustmentStatus.PENDING_APPROVAL).count();
        long approved = all.stream().filter(a -> a.getStatus() == Adjustment.AdjustmentStatus.APPROVED).count();
        long rejected = all.stream().filter(a -> a.getStatus() == Adjustment.AdjustmentStatus.REJECTED).count();
        long completed = all.stream().filter(a -> a.getStatus() == Adjustment.AdjustmentStatus.COMPLETED).count();
        
        // Calculate total value
        BigDecimal totalValue = all.stream()
            .map(Adjustment::getTotalValue)
            .filter(v -> v != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        return Map.of(
            "total", total,
            "draft", draft,
            "pendingApproval", pending,
            "approved", approved,
            "rejected", rejected,
            "completed", completed,
            "totalValue", totalValue,
            "avgValue", total > 0 ? totalValue.divide(BigDecimal.valueOf(total), 2, BigDecimal.ROUND_HALF_UP) : BigDecimal.ZERO
        );
    }
    
    // Private helper methods
    
    private void validateUniqueConstraints(AdjustmentPayload payload, String existingId) {
        // For adjustments, we typically don't need unique constraints like serial numbers
        // but we could add validation for business rules if needed
    }
    
    private static String generateAdjustmentNumber() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "ADJ-" + token;
    }
    
    private void applyPayload(Adjustment target, AdjustmentPayload payload) {
        target.setItemId(UUID.fromString(payload.itemId()));
        target.setWarehouseId(UUID.fromString(payload.warehouseId()));
        target.setLocationId(payload.locationId() != null ? UUID.fromString(payload.locationId()) : null);
        target.setLotId(payload.lotId() != null ? UUID.fromString(payload.lotId()) : null);
        target.setSerialId(payload.serialId() != null ? UUID.fromString(payload.serialId()) : null);
        target.setAdjustmentType(payload.adjustmentType());
        target.setAdjustmentReason(payload.adjustmentReason());
        target.setQuantityBefore(payload.quantityBefore());
        target.setQuantityAfter(payload.quantityAfter());
        target.setCostPerUnit(payload.costPerUnit());
        target.setApprovedBy(payload.approvedBy());
        target.setPerformedBy(payload.performedBy());
        target.setReferenceDocument(payload.referenceDocument());
        target.setNotes(payload.notes());
    }
    
    private AdjustmentDto toDto(Adjustment adjustment) {
        return new AdjustmentDto(
            adjustment.getId().toString(),
            adjustment.getAdjustmentNumber(),
            adjustment.getItemId().toString(),
            adjustment.getWarehouseId().toString(),
            adjustment.getLocationId() != null ? adjustment.getLocationId().toString() : null,
            adjustment.getLotId() != null ? adjustment.getLotId().toString() : null,
            adjustment.getSerialId() != null ? adjustment.getSerialId().toString() : null,
            adjustment.getAdjustmentType(),
            adjustment.getAdjustmentReason(),
            adjustment.getQuantityBefore(),
            adjustment.getQuantityAfter(),
            adjustment.getQuantityDifference(),
            adjustment.getCostPerUnit(),
            adjustment.getTotalValue(),
            adjustment.getStatus(),
            adjustment.getApprovedBy(),
            adjustment.getApprovedAt(),
            adjustment.getPerformedBy(),
            adjustment.getPerformedAt(),
            adjustment.getReferenceDocument(),
            adjustment.getNotes(),
            adjustment.getCreatedAt(),
            adjustment.getUpdatedAt()
        );
    }
    
    private boolean matchesQuery(Adjustment adjustment, String query) {
        String q = query.toLowerCase();
        return contains(adjustment.getAdjustmentNumber(), q)
            || contains(adjustment.getAdjustmentReason(), q)
            || contains(adjustment.getReferenceDocument(), q)
            || contains(adjustment.getNotes(), q);
    }
    
    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase().contains(q);
    }
}