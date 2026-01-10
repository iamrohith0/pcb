package com.pcbxpress.erp.modules.engineering.stackup.service;

import com.pcbxpress.erp.modules.engineering.stackup.dto.StackupTemplateDto;
import com.pcbxpress.erp.modules.engineering.stackup.model.StackupTemplate;
import com.pcbxpress.erp.modules.engineering.stackup.repository.StackupTemplateRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class StackupTemplateService {
    
    private final StackupTemplateRepository stackupTemplateRepository;
    
    public StackupTemplateService(StackupTemplateRepository stackupTemplateRepository) {
        this.stackupTemplateRepository = stackupTemplateRepository;
    }
    
    public List<StackupTemplateDto> list(String query, String materialType, Integer layerCount, Boolean impedanceControlled) {
        List<StackupTemplate> templates = stackupTemplateRepository.findAll();
        
        if (query != null && !query.trim().isEmpty()) {
            String q = query.toLowerCase();
            templates = templates.stream()
                .filter(t -> matchesQuery(t, q))
                .collect(Collectors.toList());
        }
        
        if (materialType != null && !materialType.trim().isEmpty()) {
            templates = templates.stream()
                .filter(t -> t.getMaterialType() != null && t.getMaterialType().toLowerCase().contains(materialType.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        if (layerCount != null) {
            templates = templates.stream()
                .filter(t -> t.getLayerCount() != null && t.getLayerCount().equals(layerCount))
                .collect(Collectors.toList());
        }
        
        if (impedanceControlled != null) {
            templates = templates.stream()
                .filter(t -> t.isImpedanceControlled() == impedanceControlled)
                .collect(Collectors.toList());
        }
        
        return templates.stream()
            .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
            .map(StackupTemplateDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public StackupTemplateDto getById(UUID id) {
        StackupTemplate template = stackupTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Stackup template not found: " + id));
        return StackupTemplateDto.fromEntity(template);
    }
    
    public StackupTemplateDto create(StackupTemplate template) {
        template.setId(UUID.randomUUID());
        template.setCreatedAt(OffsetDateTime.now());
        template.setUpdatedAt(OffsetDateTime.now());
        
        // Set default values if not provided
        if (!template.isActive()) {
            template.setActive(true);
        }
        
        // Note: isDefault() returns primitive boolean, so it can't be null
        // The default value for primitive boolean is false
        
        StackupTemplate saved = stackupTemplateRepository.save(template);
        return StackupTemplateDto.fromEntity(saved);
    }
    
    public StackupTemplateDto update(UUID id, StackupTemplate template) {
        StackupTemplate existing = stackupTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Stackup template not found: " + id));
        
        // Update fields
        existing.setName(template.getName());
        existing.setDescription(template.getDescription());
        existing.setLayerCount(template.getLayerCount());
        existing.setTotalThickness(template.getTotalThickness());
        existing.setCopperThickness(template.getCopperThickness());
        existing.setMaterialType(template.getMaterialType());
        existing.setDielectricConstant(template.getDielectricConstant());
        existing.setDissipationFactor(template.getDissipationFactor());
        existing.setGlassWeaveType(template.getGlassWeaveType());
        existing.setGlassWeaveStyle(template.getGlassWeaveStyle());
        existing.setPrepregType(template.getPrepregType());
        existing.setPrepregThickness(template.getPrepregThickness());
        existing.setCoreType(template.getCoreType());
        existing.setCoreThickness(template.getCoreThickness());
        existing.setSolderMaskThickness(template.getSolderMaskThickness());
        existing.setLegendThickness(template.getLegendThickness());
        existing.setSurfaceFinish(template.getSurfaceFinish());
        existing.setImpedanceControlled(template.isImpedanceControlled());
        existing.setControlledImpedanceLayers(template.getControlledImpedanceLayers());
        existing.setTargetImpedance(template.getTargetImpedance());
        existing.setImpedanceTolerance(template.getImpedanceTolerance());
        existing.setTraceWidth(template.getTraceWidth());
        existing.setTraceSpacing(template.getTraceSpacing());
        existing.setViaSize(template.getViaSize());
        existing.setViaPadSize(template.getViaPadSize());
        existing.setViaClearance(template.getViaClearance());
        existing.setMicroviaSize(template.getMicroviaSize());
        existing.setMicroviaPadSize(template.getMicroviaPadSize());
        existing.setBlindViaSize(template.getBlindViaSize());
        existing.setBuriedViaSize(template.getBuriedViaSize());
        existing.setLaserViaSize(template.getLaserViaSize());
        existing.setBackdrillSize(template.getBackdrillSize());
        existing.setPlatedHoles(template.isPlatedHoles());
        existing.setNonPlatedHoles(template.isNonPlatedHoles());
        existing.setCastellatedHoles(template.isCastellatedHoles());
        existing.setEdgePlating(template.isEdgePlating());
        existing.setRigidFlex(template.isRigidFlex());
        existing.setFlexRigid(template.isFlexRigid());
        existing.setFlexCable(template.isFlexCable());
        existing.setMetalCore(template.isMetalCore());
        existing.setCeramicSubstrate(template.isCeramicSubstrate());
        existing.setHighFreqMaterial(template.isHighFreqMaterial());
        existing.setHighTempMaterial(template.isHighTempMaterial());
        existing.setFlexibleMaterial(template.isFlexibleMaterial());
        existing.setRigidMaterial(template.isRigidMaterial());
        existing.setStandardMaterial(template.isStandardMaterial());
        existing.setSpecialMaterial(template.isSpecialMaterial());
        existing.setNotes(template.getNotes());
        existing.setCreatedBy(template.getCreatedBy());
        existing.setCreatedByName(template.getCreatedByName());
        existing.setApprovedBy(template.getApprovedBy());
        existing.setApprovedByName(template.getApprovedByName());
        existing.setApprovedAt(template.getApprovedAt());
        existing.setVersion(template.getVersion());
        existing.setActive(template.isActive());
        existing.setDefault(template.isDefault());
        
        existing.setUpdatedAt(OffsetDateTime.now());
        
        StackupTemplate saved = stackupTemplateRepository.save(existing);
        return StackupTemplateDto.fromEntity(saved);
    }
    
    public void delete(UUID id) {
        StackupTemplate template = stackupTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Stackup template not found: " + id));
        stackupTemplateRepository.delete(template);
    }
    
    public void deleteBulk(List<UUID> ids) {
        List<StackupTemplate> templates = stackupTemplateRepository.findAllById(ids);
        stackupTemplateRepository.deleteAll(templates);
    }
    
    public StackupTemplateDto updateStatus(UUID id, boolean active) {
        StackupTemplate template = stackupTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Stackup template not found: " + id));
        
        template.setActive(active);
        template.setUpdatedAt(OffsetDateTime.now());
        
        StackupTemplate saved = stackupTemplateRepository.save(template);
        return StackupTemplateDto.fromEntity(saved);
    }
    
    public List<StackupTemplateDto> getByMaterialType(String materialType) {
        return stackupTemplateRepository.findByMaterialTypeIgnoreCase(materialType).stream()
            .map(StackupTemplateDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<StackupTemplateDto> getByLayerCount(Integer layerCount) {
        return stackupTemplateRepository.findByLayerCount(layerCount).stream()
            .map(StackupTemplateDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<StackupTemplateDto> getActiveTemplates() {
        return stackupTemplateRepository.findByIsActiveTrue().stream()
            .map(StackupTemplateDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<StackupTemplateDto> getDefaultTemplates() {
        return stackupTemplateRepository.findByIsDefaultTrue().stream()
            .map(StackupTemplateDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public long countByMaterialType(String materialType) {
        return stackupTemplateRepository.countByMaterialType(materialType);
    }
    
    public long countByLayerCount(Integer layerCount) {
        return stackupTemplateRepository.countByLayerCount(layerCount);
    }
    
    public long countActive() {
        return stackupTemplateRepository.countByIsActiveTrue();
    }
    
    private boolean matchesQuery(StackupTemplate template, String query) {
        return template.getName().toLowerCase().contains(query) ||
               (template.getDescription() != null && template.getDescription().toLowerCase().contains(query)) ||
               (template.getMaterialType() != null && template.getMaterialType().toLowerCase().contains(query)) ||
               (template.getSurfaceFinish() != null && template.getSurfaceFinish().toLowerCase().contains(query));
    }
}