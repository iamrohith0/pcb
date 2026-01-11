package com.pcbxpress.erp.modules.traceability.batch.service;

import com.pcbxpress.erp.modules.traceability.batch.dto.BatchDto;
import com.pcbxpress.erp.modules.traceability.batch.dto.BatchPayload;
import com.pcbxpress.erp.modules.traceability.batch.model.Batch;
import com.pcbxpress.erp.modules.traceability.batch.repository.BatchRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
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
 * Service for managing Batch entities
 */
@Service
@Transactional
public class BatchService {
    
    private final BatchRepository batchRepository;
    
    public BatchService(BatchRepository batchRepository) {
        this.batchRepository = batchRepository;
    }
    
    /**
     * List batches with optional filters
     */
    public List<BatchDto> list(String query, String itemId, Batch.BatchStatus status, 
                              Boolean isActive, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page != null ? page : 0, size != null ? size : 20);
        UUID itemUUID = itemId != null ? UUID.fromString(itemId) : null;
        
        Page<Batch> batches = batchRepository.findByCriteria(itemUUID, status, isActive, query, pageable);
        return batches.stream()
            .sorted(Comparator.comparing(Batch::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single batch by ID
     */
    public BatchDto get(String id) {
        Batch batch = batchRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Batch not found: " + id));
        return toDto(batch);
    }
    
    /**
     * Create a new batch
     */
    public BatchDto create(BatchPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Batch batch = new Batch();
        batch.setId(UUID.randomUUID());
        applyPayload(batch, payload);
        
        // Auto-generate batch number if not provided
        if (batch.getBatchNumber() == null || batch.getBatchNumber().isBlank()) {
            batch.setBatchNumber(generateBatchNumber());
        }
        
        // Set default values
        if (batch.isActive() == false) {
            batch.setActive(true);
        }
        
        if (batch.getStatus() == null) {
            batch.setStatus(Batch.BatchStatus.ACTIVE);
        }
        
        Batch saved = batchRepository.save(batch);
        return toDto(saved);
    }
    
    /**
     * Update an existing batch
     */
    public BatchDto update(String id, BatchPayload payload) {
        Batch existing = batchRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Batch not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Batch saved = batchRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a batch
     */
    public void delete(String id) {
        batchRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple batches
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(BatchService::parseId).collect(Collectors.toList());
        batchRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search batches by query
     */
    public List<BatchDto> search(String query) {
        return batchRepository.findByCriteria(null, null, null, query, PageRequest.of(0, 100)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Register a new batch
     */
    public BatchDto registerBatch(BatchPayload payload) {
        return create(payload);
    }
    
    /**
     * Get batch history (this would typically involve audit logs)
     */
    public List<BatchDto> getBatchHistory(String id) {
        // For now, return current batch info
        // In a real implementation, this would query audit logs
        return List.of(get(id));
    }
    
    /**
     * Get batch traceability information
     */
    public Map<String, Object> getBatchTraceability(String id) {
        Batch batch = batchRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Batch not found: " + id));
        
        return Map.of(
            "batch", toDto(batch),
            "productionDate", batch.getProductionDate(),
            "expiryDate", batch.getExpiryDate(),
            "status", batch.getStatus(),
            "location", batch.getLocation(),
            "warehouseId", batch.getWarehouseId(),
            "supplierId", batch.getSupplierId(),
            "lotNumber", batch.getLotNumber(),
            "serialRange", Map.of(
                "start", batch.getSerialStart(),
                "end", batch.getSerialEnd()
            ),
            "dimensions", Map.of(
                "weight", batch.getWeight(),
                "length", batch.getLength(),
                "width", batch.getWidth(),
                "height", batch.getHeight(),
                "volume", batch.getVolume()
            )
        );
    }
    
    /**
     * Scan batch (update location/status based on scan)
     */
    public BatchDto scanBatch(String batchNumber, String location, String notes) {
        Batch batch = batchRepository.findByBatchNumber(batchNumber);
        if (batch == null) {
            throw new NoSuchElementException("Batch not found: " + batchNumber);
        }
        
        batch.setLocation(location);
        if (notes != null && !notes.isBlank()) {
            batch.setNotes(notes);
        }
        
        Batch saved = batchRepository.save(batch);
        return toDto(saved);
    }
    
    /**
     * Get batches by item ID
     */
    public List<BatchDto> getByItem(String itemId) {
        List<Batch> batches = batchRepository.findByItemId(UUID.fromString(itemId));
        return batches.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get batches by status
     */
    public List<BatchDto> getByStatus(Batch.BatchStatus status) {
        List<Batch> batches = batchRepository.findByStatus(status);
        return batches.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get expired batches
     */
    public List<BatchDto> getExpiredBatches() {
        List<Batch> batches = batchRepository.findExpiredBatches(OffsetDateTime.now(), Batch.BatchStatus.EXPIRED);
        return batches.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get batches needing reorder
     */
    public List<BatchDto> getBatchesNeedingReorder(Integer threshold) {
        List<Batch> batches = batchRepository.findBatchesNeedingReorder(threshold != null ? threshold : 10, Batch.BatchStatus.ACTIVE);
        return batches.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get batch statistics
     */
    public Map<String, Object> getStats() {
        long total = batchRepository.count();
        long active = batchRepository.countByStatus(Batch.BatchStatus.ACTIVE);
        long inactive = batchRepository.countByStatus(Batch.BatchStatus.INACTIVE);
        long expired = batchRepository.countByStatus(Batch.BatchStatus.EXPIRED);
        long onHold = batchRepository.countByStatus(Batch.BatchStatus.ON_HOLD);
        long recalled = batchRepository.countByStatus(Batch.BatchStatus.RECALLED);
        long disposed = batchRepository.countByStatus(Batch.BatchStatus.DISPOSED);
        
        return Map.of(
            "total", total,
            "active", active,
            "inactive", inactive,
            "expired", expired,
            "onHold", onHold,
            "recalled", recalled,
            "disposed", disposed
        );
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Batch not found: " + id);
        }
    }
    
    private static String generateBatchNumber() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "BATCH-" + token;
    }
    
    private void validateUniqueConstraints(BatchPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate batch number
        if (payload.batchNumber() != null && !payload.batchNumber().isBlank()) {
            boolean exists = batchRepository.existsByBatchNumberIgnoreCaseAndIdNot(payload.batchNumber(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Batch number already exists: " + payload.batchNumber());
            }
        }
    }
    
    private void applyPayload(Batch target, BatchPayload payload) {
        target.setBatchNumber(payload.batchNumber());
        target.setItemId(payload.itemId() != null ? UUID.fromString(payload.itemId()) : null);
        target.setProductionDate(payload.productionDate());
        target.setExpiryDate(payload.expiryDate());
        target.setQuantity(payload.quantity());
        target.setStatus(payload.status());
        target.setLocation(payload.location());
        target.setWarehouseId(payload.warehouseId() != null ? UUID.fromString(payload.warehouseId()) : null);
        target.setSupplierId(payload.supplierId() != null ? UUID.fromString(payload.supplierId()) : null);
        target.setLotNumber(payload.lotNumber());
        target.setSerialStart(payload.serialStart());
        target.setSerialEnd(payload.serialEnd());
        target.setWeight(payload.weight());
        target.setLength(payload.length());
        target.setWidth(payload.width());
        target.setHeight(payload.height());
        target.setVolume(payload.volume());
        target.setActive(payload.isActive());
        target.setNotes(payload.notes());
    }
    
    private BatchDto toDto(Batch batch) {
        return new BatchDto(
            batch.getId().toString(),
            batch.getBatchNumber(),
            batch.getItemId().toString(),
            batch.getProductionDate(),
            batch.getExpiryDate(),
            batch.getQuantity(),
            batch.getStatus(),
            batch.getLocation(),
            batch.getWarehouseId() != null ? batch.getWarehouseId().toString() : null,
            batch.getSupplierId() != null ? batch.getSupplierId().toString() : null,
            batch.getLotNumber(),
            batch.getSerialStart(),
            batch.getSerialEnd(),
            batch.getWeight(),
            batch.getLength(),
            batch.getWidth(),
            batch.getHeight(),
            batch.getVolume(),
            batch.isActive(),
            batch.getNotes(),
            safeOffset(batch.getCreatedAt()),
            safeOffset(batch.getUpdatedAt())
        );
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}