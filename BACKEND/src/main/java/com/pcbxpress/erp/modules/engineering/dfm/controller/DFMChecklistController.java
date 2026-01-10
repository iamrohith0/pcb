package com.pcbxpress.erp.modules.engineering.dfm.controller;

import com.pcbxpress.erp.modules.engineering.dfm.dto.DFMChecklistDto;
import com.pcbxpress.erp.modules.engineering.dfm.dto.DFMChecklistPayload;
import com.pcbxpress.erp.modules.engineering.dfm.model.DFMStatus;
import com.pcbxpress.erp.modules.engineering.dfm.service.DFMChecklistService;
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
@RequestMapping("/api/engineering/dfm/checklists")
public class DFMChecklistController {
    
    private final DFMChecklistService dfmChecklistService;
    
    @Autowired
    public DFMChecklistController(DFMChecklistService dfmChecklistService) {
        this.dfmChecklistService = dfmChecklistService;
    }
    
    @GetMapping
    public ResponseEntity<List<DFMChecklistDto>> getAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID customerId,
            @RequestParam(required = false) UUID jobId) {
        List<DFMChecklistDto> checklists = dfmChecklistService.list(query, status, customerId, jobId);
        return ResponseEntity.ok(checklists);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DFMChecklistDto> getById(@PathVariable UUID id) {
        DFMChecklistDto checklist = dfmChecklistService.getById(id);
        return ResponseEntity.ok(checklist);
    }
    
    @GetMapping("/job/{jobId}")
    public ResponseEntity<List<DFMChecklistDto>> getByJobId(@PathVariable UUID jobId) {
        List<DFMChecklistDto> checklists = dfmChecklistService.getByJobId(jobId);
        return ResponseEntity.ok(checklists);
    }
    
    @GetMapping("/job/{jobId}/latest")
    public ResponseEntity<DFMChecklistDto> getLatestByJobId(@PathVariable UUID jobId) {
        DFMChecklistDto checklist = dfmChecklistService.getLatestByJobId(jobId);
        return ResponseEntity.ok(checklist);
    }
    
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<DFMChecklistDto>> getByCustomerId(@PathVariable UUID customerId) {
        List<DFMChecklistDto> checklists = dfmChecklistService.getByCustomerId(customerId);
        return ResponseEntity.ok(checklists);
    }
    
    @PostMapping
    public ResponseEntity<DFMChecklistDto> create(@RequestBody DFMChecklistPayload payload) {
        DFMChecklistDto checklist = dfmChecklistService.create(payload);
        return ResponseEntity.ok(checklist);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<DFMChecklistDto> update(@PathVariable UUID id, @RequestBody DFMChecklistPayload payload) {
        DFMChecklistDto checklist = dfmChecklistService.update(id, payload);
        return ResponseEntity.ok(checklist);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        dfmChecklistService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/approve")
    public ResponseEntity<DFMChecklistDto> approve(
            @PathVariable UUID id,
            @RequestParam UUID approvedBy,
            @RequestParam String approvedByName) {
        DFMChecklistDto checklist = dfmChecklistService.approve(id, approvedBy, approvedByName);
        return ResponseEntity.ok(checklist);
    }
    
    @PostMapping("/{id}/reject")
    public ResponseEntity<DFMChecklistDto> reject(
            @PathVariable UUID id,
            @RequestParam UUID rejectedBy,
            @RequestParam String rejectedByName,
            @RequestParam String rejectedReason) {
        DFMChecklistDto checklist = dfmChecklistService.reject(id, rejectedBy, rejectedByName, rejectedReason);
        return ResponseEntity.ok(checklist);
    }
    
    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<DFMChecklistDto> updateStatus(@PathVariable UUID id, @PathVariable String status) {
        try {
            DFMStatus checklistStatus = DFMStatus.valueOf(status.toUpperCase());
            DFMChecklistDto checklist = dfmChecklistService.updateStatus(id, checklistStatus);
            return ResponseEntity.ok(checklist);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<DFMChecklistDto>> getByStatus(@PathVariable String status) {
        try {
            DFMStatus checklistStatus = DFMStatus.valueOf(status.toUpperCase());
            List<DFMChecklistDto> checklists = dfmChecklistService.list(null, status, null, null);
            return ResponseEntity.ok(checklists);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}