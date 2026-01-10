package com.pcbxpress.erp.modules.engineering.stackup.service;

import com.pcbxpress.erp.modules.engineering.stackup.dto.MaterialRuleDto;
import com.pcbxpress.erp.modules.engineering.stackup.model.MaterialRule;
import com.pcbxpress.erp.modules.engineering.stackup.repository.MaterialRuleRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MaterialRuleService {
    
    private final MaterialRuleRepository materialRuleRepository;
    
    public MaterialRuleService(MaterialRuleRepository materialRuleRepository) {
        this.materialRuleRepository = materialRuleRepository;
    }
    
    public List<MaterialRuleDto> list(String query, String materialType, String ruleType, Boolean impedanceControlled) {
        List<MaterialRule> rules = materialRuleRepository.findAll();
        
        if (query != null && !query.trim().isEmpty()) {
            String q = query.toLowerCase();
            rules = rules.stream()
                .filter(r -> matchesQuery(r, q))
                .collect(Collectors.toList());
        }
        
        if (materialType != null && !materialType.trim().isEmpty()) {
            rules = rules.stream()
                .filter(r -> r.getMaterialType() != null && r.getMaterialType().toLowerCase().contains(materialType.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        if (ruleType != null && !ruleType.trim().isEmpty()) {
            rules = rules.stream()
                .filter(r -> r.getRuleType() != null && r.getRuleType().toLowerCase().contains(ruleType.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        if (impedanceControlled != null) {
            rules = rules.stream()
                .filter(r -> r.isImpedanceControlled() == impedanceControlled)
                .collect(Collectors.toList());
        }
        
        return rules.stream()
            .sorted((a, b) -> b.getUpdatedAt().compareTo(a.getUpdatedAt()))
            .map(MaterialRuleDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public MaterialRuleDto getById(UUID id) {
        MaterialRule rule = materialRuleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Material rule not found: " + id));
        return MaterialRuleDto.fromEntity(rule);
    }
    
    public MaterialRuleDto create(MaterialRule rule) {
        rule.setId(UUID.randomUUID());
        rule.setCreatedAt(OffsetDateTime.now());
        rule.setUpdatedAt(OffsetDateTime.now());
        
        // Set default values if not provided
        if (!rule.isActive()) {
            rule.setActive(true);
        }
        
        MaterialRule saved = materialRuleRepository.save(rule);
        return MaterialRuleDto.fromEntity(saved);
    }
    
    public MaterialRuleDto update(UUID id, MaterialRule rule) {
        MaterialRule existing = materialRuleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Material rule not found: " + id));
        
        // Update fields
        existing.setMaterialType(rule.getMaterialType());
        existing.setRuleType(rule.getRuleType());
        existing.setRuleName(rule.getRuleName());
        existing.setRuleDescription(rule.getRuleDescription());
        existing.setMinValue(rule.getMinValue());
        existing.setMaxValue(rule.getMaxValue());
        existing.setTargetValue(rule.getTargetValue());
        existing.setTolerance(rule.getTolerance());
        existing.setUnit(rule.getUnit());
        existing.setLayerCountMin(rule.getLayerCountMin());
        existing.setLayerCountMax(rule.getLayerCountMax());
        existing.setThicknessMin(rule.getThicknessMin());
        existing.setThicknessMax(rule.getThicknessMax());
        existing.setCopperThicknessMin(rule.getCopperThicknessMin());
        existing.setCopperThicknessMax(rule.getCopperThicknessMax());
        existing.setDielectricConstantMin(rule.getDielectricConstantMin());
        existing.setDielectricConstantMax(rule.getDielectricConstantMax());
        existing.setDissipationFactorMin(rule.getDissipationFactorMin());
        existing.setDissipationFactorMax(rule.getDissipationFactorMax());
        existing.setGlassWeaveType(rule.getGlassWeaveType());
        existing.setGlassWeaveStyle(rule.getGlassWeaveStyle());
        existing.setPrepregType(rule.getPrepregType());
        existing.setCoreType(rule.getCoreType());
        existing.setSurfaceFinish(rule.getSurfaceFinish());
        existing.setImpedanceControlled(rule.isImpedanceControlled());
        existing.setPlatedHoles(rule.isPlatedHoles());
        existing.setNonPlatedHoles(rule.isNonPlatedHoles());
        existing.setCastellatedHoles(rule.isCastellatedHoles());
        existing.setEdgePlating(rule.isEdgePlating());
        existing.setRigidFlex(rule.isRigidFlex());
        existing.setFlexRigid(rule.isFlexRigid());
        existing.setFlexCable(rule.isFlexCable());
        existing.setMetalCore(rule.isMetalCore());
        existing.setCeramicSubstrate(rule.isCeramicSubstrate());
        existing.setHighFreqMaterial(rule.isHighFreqMaterial());
        existing.setHighTempMaterial(rule.isHighTempMaterial());
        existing.setFlexibleMaterial(rule.isFlexibleMaterial());
        existing.setRigidMaterial(rule.isRigidMaterial());
        existing.setStandardMaterial(rule.isStandardMaterial());
        existing.setSpecialMaterial(rule.isSpecialMaterial());
        existing.setActive(rule.isActive());
        existing.setDefault(rule.isDefault());
        existing.setNotes(rule.getNotes());
        existing.setCreatedBy(rule.getCreatedBy());
        existing.setCreatedByName(rule.getCreatedByName());
        existing.setApprovedBy(rule.getApprovedBy());
        existing.setApprovedByName(rule.getApprovedByName());
        existing.setApprovedAt(rule.getApprovedAt());
        existing.setVersion(rule.getVersion());
        
        existing.setUpdatedAt(OffsetDateTime.now());
        
        MaterialRule saved = materialRuleRepository.save(existing);
        return MaterialRuleDto.fromEntity(saved);
    }
    
    public void delete(UUID id) {
        MaterialRule rule = materialRuleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Material rule not found: " + id));
        materialRuleRepository.delete(rule);
    }
    
    public void deleteBulk(List<UUID> ids) {
        List<MaterialRule> rules = materialRuleRepository.findAllById(ids);
        materialRuleRepository.deleteAll(rules);
    }
    
    public MaterialRuleDto updateStatus(UUID id, boolean active) {
        MaterialRule rule = materialRuleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Material rule not found: " + id));
        
        rule.setActive(active);
        rule.setUpdatedAt(OffsetDateTime.now());
        
        MaterialRule saved = materialRuleRepository.save(rule);
        return MaterialRuleDto.fromEntity(saved);
    }
    
    public List<MaterialRuleDto> getByMaterialType(String materialType) {
        return materialRuleRepository.findByMaterialTypeIgnoreCase(materialType).stream()
            .map(MaterialRuleDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<MaterialRuleDto> getByRuleType(String ruleType) {
        return materialRuleRepository.findByRuleTypeIgnoreCase(ruleType).stream()
            .map(MaterialRuleDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<MaterialRuleDto> getActiveRules() {
        return materialRuleRepository.findByIsActiveTrue().stream()
            .map(MaterialRuleDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public List<MaterialRuleDto> getDefaultRules() {
        return materialRuleRepository.findByIsDefaultTrue().stream()
            .map(MaterialRuleDto::fromEntity)
            .collect(Collectors.toList());
    }
    
    public long countByMaterialType(String materialType) {
        return materialRuleRepository.countByMaterialType(materialType);
    }
    
    public long countByRuleType(String ruleType) {
        return materialRuleRepository.countByRuleType(ruleType);
    }
    
    public long countActive() {
        return materialRuleRepository.countByIsActiveTrue();
    }
    
    private boolean matchesQuery(MaterialRule rule, String query) {
        return rule.getRuleName().toLowerCase().contains(query) ||
               (rule.getRuleDescription() != null && rule.getRuleDescription().toLowerCase().contains(query)) ||
               (rule.getMaterialType() != null && rule.getMaterialType().toLowerCase().contains(query)) ||
               (rule.getRuleType() != null && rule.getRuleType().toLowerCase().contains(query));
    }
}