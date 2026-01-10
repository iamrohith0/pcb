package com.pcbxpress.erp.modules.engineering.cam.controller;

import com.pcbxpress.erp.modules.engineering.cam.dto.CamOutputDto;
import com.pcbxpress.erp.modules.engineering.cam.model.CamOutput;
import com.pcbxpress.erp.modules.engineering.cam.model.OutputStatus;
import com.pcbxpress.erp.modules.engineering.cam.model.OutputType;
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
@RequestMapping("/api/engineering/cam-outputs")
public class CamOutputController {
    
    private final CamOutputService camOutputService;
    
    @Autowired
    public CamOutputController(CamOutputService camOutputService) {
        this.camOutputService = camOutputService;
    }
    
    @GetMapping
    public ResponseEntity<List<CamOutputDto>> getAll() {
        List<CamOutputDto> outputs = camOutputService.getByCreatedBy(null); // This will be updated based on requirements
        return ResponseEntity.ok(outputs);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CamOutputDto> getById(@PathVariable UUID id) {
        CamOutputDto output = camOutputService.getById(id);
        return ResponseEntity.ok(output);
    }
    
    @PostMapping
    public ResponseEntity<CamOutputDto> create(@RequestBody CamOutput output) {
        CamOutputDto created = camOutputService.create(output);
        return ResponseEntity.ok(created);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CamOutputDto> update(@PathVariable UUID id, @RequestBody CamOutput output) {
        CamOutputDto updated = camOutputService.update(id, output);
        return ResponseEntity.ok(updated);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        camOutputService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/job/{camJobId}")
    public ResponseEntity<List<CamOutputDto>> getByCamJobId(@PathVariable UUID camJobId) {
        List<CamOutputDto> outputs = camOutputService.getByCamJobId(camJobId);
        return ResponseEntity.ok(outputs);
    }
    
    @GetMapping("/job/{camJobId}/type/{outputType}")
    public ResponseEntity<List<CamOutputDto>> getByCamJobIdAndType(
            @PathVariable UUID camJobId,
            @PathVariable String outputType) {
        try {
            OutputType type = OutputType.valueOf(outputType.toUpperCase());
            List<CamOutputDto> outputs = camOutputService.getByCamJobIdAndType(camJobId, type);
            return ResponseEntity.ok(outputs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/job/{camJobId}/status/{status}")
    public ResponseEntity<List<CamOutputDto>> getByCamJobIdAndStatus(
            @PathVariable UUID camJobId,
            @PathVariable String status) {
        try {
            OutputStatus outputStatus = OutputStatus.valueOf(status.toUpperCase());
            List<CamOutputDto> outputs = camOutputService.getByCamJobIdAndStatus(camJobId, outputStatus);
            return ResponseEntity.ok(outputs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<Void> updateStatus(@PathVariable UUID id, @PathVariable String status) {
        try {
            OutputStatus outputStatus = OutputStatus.valueOf(status.toUpperCase());
            camOutputService.updateStatus(id, outputStatus);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/{id}/download")
    public ResponseEntity<Void> incrementDownloadCount(@PathVariable UUID id) {
        camOutputService.incrementDownloadCount(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/type/{outputType}")
    public ResponseEntity<List<CamOutputDto>> getByOutputType(@PathVariable String outputType) {
        try {
            OutputType type = OutputType.valueOf(outputType.toUpperCase());
            List<CamOutputDto> outputs = camOutputService.getByOutputType(type);
            return ResponseEntity.ok(outputs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<CamOutputDto>> getByStatus(@PathVariable String status) {
        try {
            OutputStatus outputStatus = OutputStatus.valueOf(status.toUpperCase());
            List<CamOutputDto> outputs = camOutputService.getByStatus(outputStatus);
            return ResponseEntity.ok(outputs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/job/{camJobId}")
    public ResponseEntity<Void> deleteByCamJobId(@PathVariable UUID camJobId) {
        camOutputService.deleteByCamJobId(camJobId);
        return ResponseEntity.noContent().build();
    }
}