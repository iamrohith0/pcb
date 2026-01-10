package com.pcbxpress.erp.modules.engineering.cam.controller;

import com.pcbxpress.erp.modules.engineering.cam.dto.CamJobDto;
import com.pcbxpress.erp.modules.engineering.cam.dto.CamJobPayload;
import com.pcbxpress.erp.modules.engineering.cam.model.CamJobStatus;
import com.pcbxpress.erp.modules.engineering.cam.service.CamJobService;
import com.pcbxpress.erp.modules.engineering.cam.service.CamOutputService;
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
@RequestMapping("/api/engineering/cam")
public class CamJobController {
    
    private final CamJobService camJobService;
    private final CamOutputService camOutputService;
    
    @Autowired
    public CamJobController(CamJobService camJobService, CamOutputService camOutputService) {
        this.camJobService = camJobService;
        this.camOutputService = camOutputService;
    }
    
    @GetMapping
    public ResponseEntity<List<CamJobDto>> getAll(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID customerId) {
        List<CamJobDto> jobs = camJobService.list(query, status, customerId);
        return ResponseEntity.ok(jobs);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CamJobDto> getById(@PathVariable UUID id) {
        CamJobDto job = camJobService.getById(id);
        return ResponseEntity.ok(job);
    }
    
    @PostMapping
    public ResponseEntity<CamJobDto> create(@RequestBody CamJobPayload payload) {
        CamJobDto job = camJobService.create(payload);
        return ResponseEntity.ok(job);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CamJobDto> update(@PathVariable UUID id, @RequestBody CamJobPayload payload) {
        CamJobDto job = camJobService.update(id, payload);
        return ResponseEntity.ok(job);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        camJobService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{id}/process")
    public ResponseEntity<CamJobDto> processCamJob(@PathVariable UUID id) {
        CamJobDto job = camJobService.updateStatus(id, CamJobStatus.IN_PROGRESS);
        return ResponseEntity.ok(job);
    }
    
    @GetMapping("/{id}/outputs")
    public ResponseEntity<List<?>> getCamOutputs(@PathVariable UUID id) {
        List<?> outputs = camOutputService.getByCamJobId(id);
        return ResponseEntity.ok(outputs);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<CamJobDto>> getByStatus(@PathVariable String status) {
        try {
            CamJobStatus jobStatus = CamJobStatus.valueOf(status.toUpperCase());
            List<CamJobDto> jobs = camJobService.getByStatus(jobStatus);
            return ResponseEntity.ok(jobs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<CamJobDto>> getByCustomerId(@PathVariable UUID customerId) {
        List<CamJobDto> jobs = camJobService.getByCustomerId(customerId);
        return ResponseEntity.ok(jobs);
    }
}