package com.pcbxpress.erp.modules.engineering.stackup.controller;

import com.pcbxpress.erp.modules.engineering.stackup.dto.MaterialRuleDto;
import com.pcbxpress.erp.modules.engineering.stackup.model.MaterialRule;
import com.pcbxpress.erp.modules.engineering.stackup.service.MaterialRuleService;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/engineering/stackup/material-rules")
public class MaterialRuleController {
    
    private final MaterialRuleService materialRuleService;
    
    @Autowired
    public MaterialRuleController(MaterialRuleService materialRuleService) {
        this.materialRuleService = materialRuleService;
    }
    
    @GetMapping
    public ResponseEntity<List<MaterialRuleDto>> getAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String materialType,
            @RequestParam(required = false) String ruleType,
            @RequestParam(required = false) Boolean impedanceControlled) {
        List<MaterialRuleDto> rules = materialRuleService.list(query, materialType, ruleType, impedanceControlled);
        return ResponseEntity.ok(rules);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MaterialRuleDto> getById(@PathVariable UUID id) {
        MaterialRuleDto rule = materialRuleService.getById(id);
        return ResponseEntity.ok(rule);
    }
    
    @PostMapping
    public ResponseEntity<MaterialRuleDto> create(@RequestBody MaterialRule rule) {
        MaterialRuleDto created = materialRuleService.create(rule);
        return ResponseEntity.ok(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MaterialRuleDto> update(@PathVariable UUID id, @RequestBody MaterialRule rule) {
        MaterialRuleDto updated = materialRuleService.update(id, rule);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        materialRuleService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/material/{materialType}")
    public ResponseEntity<List<MaterialRuleDto>> getByMaterialType(@PathVariable String materialType) {
        List<MaterialRuleDto> rules = materialRuleService.getByMaterialType(materialType);
        return ResponseEntity.ok(rules);
    }
    
    @GetMapping("/type/{ruleType}")
    public ResponseEntity<List<MaterialRuleDto>> getByRuleType(@PathVariable String ruleType) {
        List<MaterialRuleDto> rules = materialRuleService.getByRuleType(ruleType);
        return ResponseEntity.ok(rules);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<MaterialRuleDto>> getActiveRules() {
        List<MaterialRuleDto> rules = materialRuleService.getActiveRules();
        return ResponseEntity.ok(rules);
    }
    
    @GetMapping("/default")
    public ResponseEntity<List<MaterialRuleDto>> getDefaultRules() {
        List<MaterialRuleDto> rules = materialRuleService.getDefaultRules();
        return ResponseEntity.ok(rules);
    }
    
    @PutMapping("/{id}/status/{active}")
    public ResponseEntity<MaterialRuleDto> updateStatus(@PathVariable UUID id, @PathVariable boolean active) {
        MaterialRuleDto rule = materialRuleService.updateStatus(id, active);
        return ResponseEntity.ok(rule);
    }
}