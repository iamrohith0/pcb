package com.pcbxpress.erp.modules.engineering.panelization.controller;

import com.pcbxpress.erp.modules.engineering.panelization.dto.PanelTemplateDto;
import com.pcbxpress.erp.modules.engineering.panelization.dto.PanelTemplatePayload;
import com.pcbxpress.erp.modules.engineering.panelization.model.PanelStatus;
import com.pcbxpress.erp.modules.engineering.panelization.service.PanelTemplateService;
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
@RequestMapping("/api/engineering/panelization/templates")
public class PanelTemplateController {
    
    private final PanelTemplateService panelTemplateService;
    
    @Autowired
    public PanelTemplateController(PanelTemplateService panelTemplateService) {
        this.panelTemplateService = panelTemplateService;
    }
    
    @GetMapping
    public ResponseEntity<List<PanelTemplateDto>> list(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String panelType,
            @RequestParam(required = false) String panelizationStyle,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID jobId) {
        
        List<PanelTemplateDto> templates = panelTemplateService.list(
            query, panelType, panelizationStyle, customerId, jobId);
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PanelTemplateDto> getById(@PathVariable UUID id) {
        PanelTemplateDto template = panelTemplateService.getById(id);
        return ResponseEntity.ok(template);
    }
    
    @PostMapping
    public ResponseEntity<PanelTemplateDto> create(@RequestBody PanelTemplatePayload payload) {
        PanelTemplateDto template = panelTemplateService.create(payload);
        return ResponseEntity.ok(template);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PanelTemplateDto> update(
            @PathVariable UUID id,
            @RequestBody PanelTemplatePayload payload) {
        
        PanelTemplateDto template = panelTemplateService.update(id, payload);
        return ResponseEntity.ok(template);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        panelTemplateService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> deleteBulk(@RequestBody List<UUID> ids) {
        panelTemplateService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<PanelTemplateDto> updateStatus(
            @PathVariable UUID id,
            @RequestBody PanelStatus status) {
        
        PanelTemplateDto template = panelTemplateService.updateStatus(id, status);
        return ResponseEntity.ok(template);
    }
    
    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<PanelTemplateDto>> getByJobId(@PathVariable UUID jobId) {
        List<PanelTemplateDto> templates = panelTemplateService.getByJobId(jobId);
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<PanelTemplateDto>> getByCustomerId(@PathVariable UUID customerId) {
        List<PanelTemplateDto> templates = panelTemplateService.getByCustomerId(customerId);
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<PanelTemplateDto>> getActiveTemplates() {
        List<PanelTemplateDto> templates = panelTemplateService.getActiveTemplates();
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/default")
    public ResponseEntity<List<PanelTemplateDto>> getDefaultTemplates() {
        List<PanelTemplateDto> templates = panelTemplateService.getDefaultTemplates();
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/count/job/{jobId}")
    public ResponseEntity<Long> countByJobId(@PathVariable UUID jobId) {
        long count = panelTemplateService.countByJobId(jobId);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/count/customer/{customerId}")
    public ResponseEntity<Long> countByCustomerId(@PathVariable UUID customerId) {
        long count = panelTemplateService.countByCustomerId(customerId);
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/count/active")
    public ResponseEntity<Long> countActive() {
        long count = panelTemplateService.countActive();
        return ResponseEntity.ok(count);
    }
}