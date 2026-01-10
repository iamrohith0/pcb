package com.pcbxpress.erp.modules.engineering.stackup.controller;

import com.pcbxpress.erp.modules.engineering.stackup.dto.StackupTemplateDto;
import com.pcbxpress.erp.modules.engineering.stackup.model.StackupTemplate;
import com.pcbxpress.erp.modules.engineering.stackup.service.StackupTemplateService;
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
@RequestMapping("/api/engineering/stackup/templates")
public class StackupTemplateController {
    
    private final StackupTemplateService stackupTemplateService;
    
    @Autowired
    public StackupTemplateController(StackupTemplateService stackupTemplateService) {
        this.stackupTemplateService = stackupTemplateService;
    }
    
    @GetMapping
    public ResponseEntity<List<StackupTemplateDto>> getAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String materialType,
            @RequestParam(required = false) Integer layerCount,
            @RequestParam(required = false) Boolean impedanceControlled) {
        List<StackupTemplateDto> templates = stackupTemplateService.list(query, materialType, layerCount, impedanceControlled);
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StackupTemplateDto> getById(@PathVariable UUID id) {
        StackupTemplateDto template = stackupTemplateService.getById(id);
        return ResponseEntity.ok(template);
    }
    
    @PostMapping
    public ResponseEntity<StackupTemplateDto> create(@RequestBody StackupTemplate template) {
        StackupTemplateDto created = stackupTemplateService.create(template);
        return ResponseEntity.ok(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<StackupTemplateDto> update(@PathVariable UUID id, @RequestBody StackupTemplate template) {
        StackupTemplateDto updated = stackupTemplateService.update(id, template);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        stackupTemplateService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/material/{materialType}")
    public ResponseEntity<List<StackupTemplateDto>> getByMaterialType(@PathVariable String materialType) {
        List<StackupTemplateDto> templates = stackupTemplateService.getByMaterialType(materialType);
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/layers/{layerCount}")
    public ResponseEntity<List<StackupTemplateDto>> getByLayerCount(@PathVariable Integer layerCount) {
        List<StackupTemplateDto> templates = stackupTemplateService.getByLayerCount(layerCount);
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<StackupTemplateDto>> getActiveTemplates() {
        List<StackupTemplateDto> templates = stackupTemplateService.getActiveTemplates();
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/default")
    public ResponseEntity<List<StackupTemplateDto>> getDefaultTemplates() {
        List<StackupTemplateDto> templates = stackupTemplateService.getDefaultTemplates();
        return ResponseEntity.ok(templates);
    }
    
    @PutMapping("/{id}/status/{active}")
    public ResponseEntity<StackupTemplateDto> updateStatus(@PathVariable UUID id, @PathVariable boolean active) {
        StackupTemplateDto template = stackupTemplateService.updateStatus(id, active);
        return ResponseEntity.ok(template);
    }
}