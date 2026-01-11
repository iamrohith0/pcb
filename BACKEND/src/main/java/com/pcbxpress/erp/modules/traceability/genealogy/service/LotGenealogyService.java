package com.pcbxpress.erp.modules.traceability.genealogy.service;

import com.pcbxpress.erp.modules.traceability.genealogy.dto.LotGenealogyDto;
import com.pcbxpress.erp.modules.traceability.genealogy.dto.LotGenealogyPayload;
import com.pcbxpress.erp.modules.traceability.genealogy.model.LotGenealogy;
import com.pcbxpress.erp.modules.traceability.genealogy.repository.LotGenealogyRepository;
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
 * Service for managing Lot Genealogy entities
 */
@Service
@Transactional
public class LotGenealogyService {
    
    private final LotGenealogyRepository genealogyRepository;
    
    public LotGenealogyService(LotGenealogyRepository genealogyRepository) {
        this.genealogyRepository = genealogyRepository;
    }
    
    /**
     * List genealogy records with optional filters
     */
    public List<LotGenealogyDto> list(String query, String parentLotId, String childLotId, 
                                     String componentId, LotGenealogy.RelationshipType relationshipType, 
                                     Boolean isActive, Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page != null ? page : 0, size != null ? size : 20);
        UUID parentUUID = parentLotId != null ? UUID.fromString(parentLotId) : null;
        UUID childUUID = childLotId != null ? UUID.fromString(childLotId) : null;
        UUID componentUUID = componentId != null ? UUID.fromString(componentId) : null;
        
        Page<LotGenealogy> genealogyRecords = genealogyRepository.findByCriteria(
            parentUUID, childUUID, componentUUID, relationshipType, isActive, query, pageable);
        
        return genealogyRecords.stream()
            .sorted(Comparator.comparing(LotGenealogy::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single genealogy record by ID
     */
    public LotGenealogyDto get(String id) {
        LotGenealogy genealogy = genealogyRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Genealogy record not found: " + id));
        return toDto(genealogy);
    }
    
    /**
     * Create a new genealogy record
     */
    public LotGenealogyDto create(LotGenealogyPayload payload) {
        LotGenealogy genealogy = new LotGenealogy();
        genealogy.setId(UUID.randomUUID());
        applyPayload(genealogy, payload);
        
        // Set default active status
        if (genealogy.isActive() == false) {
            genealogy.setActive(true);
        }
        
        LotGenealogy saved = genealogyRepository.save(genealogy);
        return toDto(saved);
    }
    
    /**
     * Update an existing genealogy record
     */
    public LotGenealogyDto update(String id, LotGenealogyPayload payload) {
        LotGenealogy existing = genealogyRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Genealogy record not found: " + id));
        
        applyPayload(existing, payload);
        
        LotGenealogy saved = genealogyRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a genealogy record
     */
    public void delete(String id) {
        genealogyRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple genealogy records
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(LotGenealogyService::parseId).collect(Collectors.toList());
        genealogyRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search genealogy records by query
     */
    public List<LotGenealogyDto> search(String query) {
        return genealogyRepository.findByCriteria(null, null, null, null, null, query, PageRequest.of(0, 100)).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get lot genealogy tree
     */
    public List<LotGenealogyDto> getLotGenealogy(String lotId, String relationshipType) {
        LotGenealogy.RelationshipType type = relationshipType != null ? 
            LotGenealogy.RelationshipType.valueOf(relationshipType.toUpperCase()) : null;
        
        List<LotGenealogy> genealogyRecords;
        if (type != null) {
            genealogyRecords = genealogyRepository.findByParentLotIdAndChildLotId(
                UUID.fromString(lotId), UUID.fromString(lotId));
            genealogyRecords = genealogyRecords.stream()
                .filter(g -> g.getRelationshipType() == type)
                .collect(Collectors.toList());
        } else {
            genealogyRecords = genealogyRepository.findGenealogyTree(UUID.fromString(lotId));
        }
        
        return genealogyRecords.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get component linking information
     */
    public List<LotGenealogyDto> getComponentLinking(String componentId, String relationshipType) {
        LotGenealogy.RelationshipType type = relationshipType != null ? 
            LotGenealogy.RelationshipType.valueOf(relationshipType.toUpperCase()) : null;
        
        List<LotGenealogy> genealogyRecords;
        if (type != null) {
            genealogyRecords = genealogyRepository.findByComponentIdAndRelationshipType(
                UUID.fromString(componentId), type);
        } else {
            genealogyRecords = genealogyRepository.findByComponentId(UUID.fromString(componentId));
        }
        
        return genealogyRecords.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get supplier trace information
     */
    public List<LotGenealogyDto> getSupplierTrace(String supplierId, String relationshipType) {
        LotGenealogy.RelationshipType type = relationshipType != null ? 
            LotGenealogy.RelationshipType.valueOf(relationshipType.toUpperCase()) : null;
        
        List<LotGenealogy> genealogyRecords;
        if (type != null) {
            genealogyRecords = genealogyRepository.findBySupplierIdAndRelationshipType(
                UUID.fromString(supplierId), type);
        } else {
            genealogyRecords = genealogyRepository.findBySupplierId(UUID.fromString(supplierId));
        }
        
        return genealogyRecords.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Link components
     */
    public LotGenealogyDto linkComponents(LotGenealogyPayload payload) {
        return create(payload);
    }
    
    /**
     * Unlink components (delete genealogy record)
     */
    public void unlinkComponents(String id) {
        delete(id);
    }
    
    /**
     * Get genealogy tree for a lot
     */
    public List<LotGenealogyDto> getGenealogyTree(String lotId) {
        List<LotGenealogy> genealogyRecords = genealogyRepository.findGenealogyTree(UUID.fromString(lotId));
        return genealogyRecords.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get upstream traceability (components used to make this lot)
     */
    public List<LotGenealogyDto> getUpstreamTraceability(String lotId) {
        List<LotGenealogy> genealogyRecords = genealogyRepository.findUpstreamTraceability(UUID.fromString(lotId));
        return genealogyRecords.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get downstream traceability (lots made from this lot)
     */
    public List<LotGenealogyDto> getDownstreamTraceability(String lotId) {
        List<LotGenealogy> genealogyRecords = genealogyRepository.findDownstreamTraceability(UUID.fromString(lotId));
        return genealogyRecords.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get traceability report
     */
    public Map<String, Object> getTraceabilityReport(String lotId) {
        List<LotGenealogyDto> upstream = getUpstreamTraceability(lotId);
        List<LotGenealogyDto> downstream = getDownstreamTraceability(lotId);
        List<LotGenealogyDto> tree = getGenealogyTree(lotId);
        
        return Map.of(
            "lotId", lotId,
            "upstream", upstream,
            "downstream", downstream,
            "tree", tree,
            "totalLinks", upstream.size() + downstream.size()
        );
    }
    
    /**
     * Get genealogy statistics
     */
    public Map<String, Object> getStats() {
        long total = genealogyRepository.count();
        long active = genealogyRepository.countByIsActive(true);
        long inactive = genealogyRepository.countByIsActive(false);
        
        // Count by relationship type
        Map<LotGenealogy.RelationshipType, Long> byType = java.util.Arrays.stream(LotGenealogy.RelationshipType.values())
            .collect(Collectors.toMap(
                type -> type,
                type -> genealogyRepository.countByRelationshipType(type)
            ));
        
        return Map.of(
            "total", total,
            "active", active,
            "inactive", inactive,
            "byType", byType
        );
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Genealogy record not found: " + id);
        }
    }
    
    private void applyPayload(LotGenealogy target, LotGenealogyPayload payload) {
        target.setParentLotId(payload.parentLotId() != null ? UUID.fromString(payload.parentLotId()) : null);
        target.setChildLotId(payload.childLotId() != null ? UUID.fromString(payload.childLotId()) : null);
        target.setComponentId(payload.componentId() != null ? UUID.fromString(payload.componentId()) : null);
        target.setRelationshipType(payload.relationshipType());
        target.setQuantityUsed(payload.quantityUsed());
        target.setUnitOfMeasure(payload.unitOfMeasure());
        target.setProductionDate(payload.productionDate());
        target.setSupplierId(payload.supplierId() != null ? UUID.fromString(payload.supplierId()) : null);
        target.setWarehouseId(payload.warehouseId() != null ? UUID.fromString(payload.warehouseId()) : null);
        target.setLocation(payload.location());
        target.setActive(payload.isActive());
        target.setNotes(payload.notes());
    }
    
    private LotGenealogyDto toDto(LotGenealogy genealogy) {
        return new LotGenealogyDto(
            genealogy.getId().toString(),
            genealogy.getParentLotId().toString(),
            genealogy.getChildLotId().toString(),
            genealogy.getComponentId() != null ? genealogy.getComponentId().toString() : null,
            genealogy.getRelationshipType(),
            genealogy.getQuantityUsed(),
            genealogy.getUnitOfMeasure(),
            genealogy.getProductionDate(),
            genealogy.getSupplierId() != null ? genealogy.getSupplierId().toString() : null,
            genealogy.getWarehouseId() != null ? genealogy.getWarehouseId().toString() : null,
            genealogy.getLocation(),
            genealogy.isActive(),
            genealogy.getNotes(),
            safeOffset(genealogy.getCreatedAt()),
            safeOffset(genealogy.getUpdatedAt())
        );
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}