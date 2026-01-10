package com.pcbxpress.erp.modules.inventory.bom.service;

import com.pcbxpress.erp.modules.inventory.bom.dto.BomDto;
import com.pcbxpress.erp.modules.inventory.bom.dto.BomPayload;
import com.pcbxpress.erp.modules.inventory.bom.model.Bom;
import com.pcbxpress.erp.modules.inventory.bom.repository.BomRepository;
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
 * Service for BOM Management
 */
@Service
@Transactional
public class BomService {
    
    private final BomRepository bomRepository;
    
    public BomService(BomRepository bomRepository) {
        this.bomRepository = bomRepository;
    }
    
    /**
     * List BOMs with optional filters
     */
    public List<BomDto> list(String query, String status, String revision, String productItemId) {
        List<Bom> boms = bomRepository.findAll();
        
        // Apply filters
        if (query != null && !query.isBlank()) {
            boms = boms.stream()
                .filter(bom -> matchesQuery(bom, query))
                .collect(Collectors.toList());
        }
        
        if (status != null && !status.isBlank()) {
            Bom.BomStatus bomStatus = Bom.BomStatus.valueOf(status.toUpperCase());
            boms = boms.stream()
                .filter(bom -> bom.getStatus() == bomStatus)
                .collect(Collectors.toList());
        }
        
        if (revision != null && !revision.isBlank()) {
            boms = boms.stream()
                .filter(bom -> bom.getRevision().equals(revision))
                .collect(Collectors.toList());
        }
        
        if (productItemId != null && !productItemId.isBlank()) {
            UUID productItemUUID = UUID.fromString(productItemId);
            boms = boms.stream()
                .filter(bom -> bom.getProductItemId().equals(productItemUUID))
                .collect(Collectors.toList());
        }
        
        return boms.stream()
            .sorted(Comparator.comparing(Bom::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single BOM by ID
     */
    public BomDto get(String id) {
        Bom bom = bomRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("BOM not found: " + id));
        return toDto(bom);
    }
    
    /**
     * Create a new BOM
     */
    public BomDto create(BomPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Bom bom = new Bom();
        bom.setId(UUID.randomUUID());
        applyPayload(bom, payload);
        
        // Auto-generate BOM number if not provided
        if (bom.getBomNumber() == null || bom.getBomNumber().isBlank()) {
            bom.setBomNumber(generateBomNumber());
        }
        
        // Set default status
        if (bom.getStatus() == null) {
            bom.setStatus(Bom.BomStatus.DRAFT);
        }
        
        // Set creation timestamp
        if (bom.getEffectiveDate() == null) {
            bom.setEffectiveDate(OffsetDateTime.now());
        }
        
        Bom saved = bomRepository.save(bom);
        return toDto(saved);
    }
    
    /**
     * Update an existing BOM
     */
    public BomDto update(String id, BomPayload payload) {
        Bom existing = bomRepository.findById(UUID.fromString(id))
            .orElseThrow(() -> new NoSuchElementException("BOM not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Bom saved = bomRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a BOM
     */
    public void delete(String id) {
        bomRepository.deleteById(UUID.fromString(id));
    }
    
    /**
     * Get BOM by product item
     */
    public List<BomDto> getByProductItem(String productItemId, int limit) {
        List<Bom> boms = bomRepository.findByProductItemId(UUID.fromString(productItemId));
        return boms.stream()
            .limit(limit)
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get active BOMs
     */
    public List<BomDto> getActiveBoms(int limit) {
        List<Bom> boms = bomRepository.findByStatus(Bom.BomStatus.ACTIVE);
        return boms.stream()
            .limit(limit)
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get BOMs effective on date
     */
    public List<BomDto> getBomsEffectiveOnDate(OffsetDateTime date, int limit) {
        List<Bom> boms = bomRepository.findBomsEffectiveOnDate(date);
        return boms.stream()
            .limit(limit)
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get latest BOM for product item
     */
    public BomDto getLatestBom(String productItemId) {
        List<Bom> boms = bomRepository.findLatestBomsByProductItem(
            UUID.fromString(productItemId), 
            Bom.BomStatus.ACTIVE
        );
        
        if (boms.isEmpty()) {
            throw new NoSuchElementException("No active BOM found for product item: " + productItemId);
        }
        
        return toDto(boms.get(0));
    }
    
    /**
     * Search BOMs
     */
    public List<BomDto> search(String query) {
        return bomRepository.findAll().stream()
            .filter(bom -> matchesQuery(bom, query))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get BOM statistics
     */
    public Map<String, Object> getStats() {
        List<Bom> all = bomRepository.findAll();
        long total = all.size();
        long draft = all.stream().filter(b -> b.getStatus() == Bom.BomStatus.DRAFT).count();
        long pending = all.stream().filter(b -> b.getStatus() == Bom.BomStatus.PENDING_APPROVAL).count();
        long approved = all.stream().filter(b -> b.getStatus() == Bom.BomStatus.APPROVED).count();
        long active = all.stream().filter(b -> b.getStatus() == Bom.BomStatus.ACTIVE).count();
        long inactive = all.stream().filter(b -> b.getStatus() == Bom.BomStatus.INACTIVE).count();
        long obsolete = all.stream().filter(b -> b.getStatus() == Bom.BomStatus.OBSOLETE).count();
        
        return Map.of(
            "total", total,
            "draft", draft,
            "pendingApproval", pending,
            "approved", approved,
            "active", active,
            "inactive", inactive,
            "obsolete", obsolete,
            "avgAssemblyLevel", calculateAverageAssemblyLevel(all)
        );
    }
    
    // Private helper methods
    
    private void validateUniqueConstraints(BomPayload payload, String existingId) {
        // For BOMs, we typically don't need unique constraints like serial numbers
        // but we could add validation for business rules if needed
    }
    
    private static String generateBomNumber() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "BOM-" + token;
    }
    
    private void applyPayload(Bom target, BomPayload payload) {
        target.setProductItemId(UUID.fromString(payload.productItemId()));
        target.setRevision(payload.revision());
        target.setVersion(payload.version());
        target.setDescription(payload.description());
        target.setStatus(payload.status());
        target.setEffectiveDate(payload.effectiveDate());
        target.setEndDate(payload.endDate());
        target.setUnitOfMeasure(payload.unitOfMeasure());
        target.setQuantityPerUnit(payload.quantityPerUnit());
        target.setAssemblyLevel(payload.assemblyLevel());
        target.setEngineer(payload.engineer());
        target.setApprover(payload.approver());
        target.setApprovedDate(payload.approvedDate());
        target.setNotes(payload.notes());
    }
    
    private BomDto toDto(Bom bom) {
        return new BomDto(
            bom.getId().toString(),
            bom.getBomNumber(),
            bom.getProductItemId().toString(),
            bom.getRevision(),
            bom.getVersion(),
            bom.getDescription(),
            bom.getStatus(),
            bom.getEffectiveDate(),
            bom.getEndDate(),
            bom.getUnitOfMeasure(),
            bom.getQuantityPerUnit(),
            bom.getAssemblyLevel(),
            bom.getEngineer(),
            bom.getApprover(),
            bom.getApprovedDate(),
            bom.getNotes(),
            bom.getCreatedAt(),
            bom.getUpdatedAt()
        );
    }
    
    private boolean matchesQuery(Bom bom, String query) {
        String q = query.toLowerCase();
        return contains(bom.getBomNumber(), q)
            || contains(bom.getDescription(), q)
            || contains(bom.getRevision(), q)
            || contains(bom.getVersion(), q)
            || contains(bom.getEngineer(), q)
            || contains(bom.getApprover(), q);
    }
    
    private static boolean contains(String value, String q) {
        return value != null && value.toLowerCase().contains(q);
    }
    
    private double calculateAverageAssemblyLevel(List<Bom> boms) {
        if (boms.isEmpty()) return 0.0;
        
        double totalLevel = boms.stream()
            .map(Bom::getAssemblyLevel)
            .filter(level -> level != null)
            .mapToInt(Integer::intValue)
            .sum();
        
        return totalLevel / boms.size();
    }
}