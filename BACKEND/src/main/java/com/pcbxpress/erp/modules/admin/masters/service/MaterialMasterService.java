package com.pcbxpress.erp.modules.admin.masters.service;

import com.pcbxpress.erp.modules.admin.masters.dto.MaterialMasterDto;
import com.pcbxpress.erp.modules.admin.masters.dto.MaterialMasterPayload;
import com.pcbxpress.erp.modules.admin.masters.model.MaterialMaster;
import com.pcbxpress.erp.modules.admin.masters.repository.MaterialMasterRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing Admin Material Master
 */
@Service
@Transactional
public class MaterialMasterService {
    
    private final MaterialMasterRepository materialMasterRepository;
    
    public MaterialMasterService(MaterialMasterRepository materialMasterRepository) {
        this.materialMasterRepository = materialMasterRepository;
    }
    
    /**
     * List materials with optional filters
     */
    public List<MaterialMasterDto> list(String query, MaterialMaster.MaterialType materialType, 
                                       MaterialMaster.Status status, String unitOfMeasure, 
                                       String preferredVendor, BigDecimal minThickness, BigDecimal maxThickness) {
        return materialMasterRepository.findByCriteria(
            materialType, status, unitOfMeasure, preferredVendor, null, null, null,
            minThickness, maxThickness, null, null, null, null, query
        ).stream()
            .sorted((m1, m2) -> m1.getName().compareToIgnoreCase(m2.getName()))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single material by ID
     */
    public MaterialMasterDto get(String id) {
        MaterialMaster material = materialMasterRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Material not found: " + id));
        return toDto(material);
    }
    
    /**
     * Create a new material
     */
    public MaterialMasterDto create(MaterialMasterPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        MaterialMaster material = new MaterialMaster();
        material.setId(UUID.randomUUID());
        applyPayload(material, payload);
        
        // Set default values
        if (material.getStatus() == null) {
            material.setStatus(MaterialMaster.Status.ACTIVE);
        }
        if (material.getCurrency() == null || material.getCurrency().isBlank()) {
            material.setCurrency("INR");
        }
        if (material.isRoHS() == false) {
            material.setRoHS(true); // Default to RoHS compliant
        }
        
        MaterialMaster saved = materialMasterRepository.save(material);
        return toDto(saved);
    }
    
    /**
     * Update an existing material
     */
    public MaterialMasterDto update(String id, MaterialMasterPayload payload) {
        MaterialMaster existing = materialMasterRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Material not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        MaterialMaster saved = materialMasterRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete a material
     */
    public void delete(String id) {
        materialMasterRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple materials
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(MaterialMasterService::parseId).collect(Collectors.toList());
        materialMasterRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search materials by query
     */
    public List<MaterialMasterDto> search(String query) {
        return materialMasterRepository.findByCriteria(
            null, null, null, null, null, null, null,
            null, null, null, null, null, null, query
        ).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get material statistics
     */
    public Map<String, Object> getStats() {
        List<MaterialMaster> all = materialMasterRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(m -> m.getStatus() == MaterialMaster.Status.ACTIVE).count();
        long inactive = all.stream().filter(m -> m.getStatus() == MaterialMaster.Status.INACTIVE).count();
        long obsolete = all.stream().filter(m -> m.getStatus() == MaterialMaster.Status.OBSOLETE).count();
        
        // Count by material type
        Map<MaterialMaster.MaterialType, Long> byType = all.stream()
            .collect(Collectors.groupingBy(MaterialMaster::getMaterialType, Collectors.counting()));
        
        // Count by unit of measure
        Map<String, Long> byUom = all.stream()
            .filter(m -> m.getUnitOfMeasure() != null)
            .collect(Collectors.groupingBy(MaterialMaster::getUnitOfMeasure, Collectors.counting()));
        
        // Count by vendor
        Map<String, Long> byVendor = all.stream()
            .filter(m -> m.getPreferredVendor() != null)
            .collect(Collectors.groupingBy(m -> m.getPreferredVendor().toLowerCase(Locale.ROOT), Collectors.counting()));
        
        // Count by compliance
        long rohsCount = all.stream().filter(MaterialMaster::isRoHS).count();
        long reachCount = all.stream().filter(MaterialMaster::isReach).count();
        long ulCount = all.stream().filter(MaterialMaster::isUl).count();
        
        return Map.of(
            "total", total,
            "active", active,
            "inactive", inactive,
            "obsolete", obsolete,
            "byType", byType,
            "byUom", byUom,
            "byVendor", byVendor,
            "compliance", Map.of(
                "rohs", rohsCount,
                "reach", reachCount,
                "ul", ulCount
            )
        );
    }
    
    /**
     * Export materials to CSV format
     */
    public String exportCsv(List<MaterialMasterDto> data) {
        String header = "Material Code,Name,Description,Type,UOM,Status,Thickness (mm),Copper (oz),Tg,Class,Finish,Color,Preferred Vendor,Vendor Part No,Lead Time (days),Min Stock,Reorder Point,Currency,Unit Price,RoHS,REACH,UL";
        String rows = data.stream()
            .map(material -> String.join(",",
                safe(material.materialCode()),
                safe(material.name()),
                safe(material.description()),
                safe(material.materialType() != null ? material.materialType().toString() : ""),
                safe(material.unitOfMeasure()),
                safe(material.status() != null ? material.status().toString() : ""),
                safe(material.thicknessMm() != null ? material.thicknessMm().toString() : ""),
                safe(material.copperOz() != null ? material.copperOz().toString() : ""),
                safe(material.tg() != null ? material.tg().toString() : ""),
                safe(material.materialClass()),
                safe(material.finish()),
                safe(material.color()),
                safe(material.preferredVendor()),
                safe(material.vendorPartNo()),
                safe(material.leadTimeDays() != null ? material.leadTimeDays().toString() : ""),
                safe(material.minStock() != null ? material.minStock().toString() : ""),
                safe(material.reorderPoint() != null ? material.reorderPoint().toString() : ""),
                safe(material.currency()),
                safe(material.unitPrice() != null ? material.unitPrice().toString() : ""),
                material.isRoHS() ? "Yes" : "No",
                material.isReach() ? "Yes" : "No",
                material.isUl() ? "Yes" : "No"
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Material not found: " + id);
        }
    }
    
    private void validateUniqueConstraints(MaterialMasterPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate material code
        if (payload.materialCode() != null && !payload.materialCode().isBlank()) {
            boolean exists = materialMasterRepository.existsByMaterialCodeIgnoreCaseAndIdNot(payload.materialCode(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Material code already exists: " + payload.materialCode());
            }
        }
    }
    
    private void applyPayload(MaterialMaster target, MaterialMasterPayload payload) {
        target.setMaterialCode(payload.materialCode());
        target.setName(payload.name());
        target.setDescription(payload.description());
        target.setMaterialType(payload.materialType());
        target.setUnitOfMeasure(payload.unitOfMeasure());
        target.setStatus(payload.status());
        target.setThicknessMm(payload.thicknessMm());
        target.setCopperOz(payload.copperOz());
        target.setTg(payload.tg());
        target.setMaterialClass(payload.materialClass());
        target.setFinish(payload.finish());
        target.setColor(payload.color());
        target.setNotes(payload.notes());
        target.setPreferredVendor(payload.preferredVendor());
        target.setVendorPartNo(payload.vendorPartNo());
        target.setLeadTimeDays(payload.leadTimeDays());
        target.setMinStock(payload.minStock());
        target.setReorderPoint(payload.reorderPoint());
        target.setCurrency(payload.currency());
        target.setUnitPrice(payload.unitPrice());
        target.setRoHS(payload.isRoHS());
        target.setReach(payload.isReach());
        target.setUl(payload.isUl());
    }
    
    private MaterialMasterDto toDto(MaterialMaster material) {
        return new MaterialMasterDto(
            material.getId().toString(),
            material.getMaterialCode(),
            material.getName(),
            material.getDescription(),
            material.getMaterialType(),
            material.getUnitOfMeasure(),
            material.getStatus(),
            material.getThicknessMm(),
            material.getCopperOz(),
            material.getTg(),
            material.getMaterialClass(),
            material.getFinish(),
            material.getColor(),
            material.getNotes(),
            material.getPreferredVendor(),
            material.getVendorPartNo(),
            material.getLeadTimeDays(),
            material.getMinStock(),
            material.getReorderPoint(),
            material.getCurrency(),
            material.getUnitPrice(),
            material.isRoHS(),
            material.isReach(),
            material.isUl(),
            safeOffset(material.getCreatedAt()),
            safeOffset(material.getUpdatedAt()),
            material.getCreatedBy(),
            material.getUpdatedBy()
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static String safe(Object value) {
        return value == null ? "" : value.toString().replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}