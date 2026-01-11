package com.pcbxpress.erp.modules.quality.aoi.controller;

import com.pcbxpress.erp.modules.quality.aoi.dto.AOIDefectDto;
import com.pcbxpress.erp.modules.quality.aoi.dto.AOIDefectPayload;
import com.pcbxpress.erp.modules.quality.aoi.service.AOIDefectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quality/aoi/defects")
@CrossOrigin(origins = "*")
public class AOIDefectController {
    
    @Autowired
    private AOIDefectService defectService;
    
    @GetMapping
    public ResponseEntity<Page<AOIDefectDto>> getAllDefects(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Boolean isActive = null;
        if (status != null) {
            isActive = "active".equalsIgnoreCase(status);
        }
        
        Pageable pageable = PageRequest.of(page, size);
        Page<AOIDefectDto> defects = defectService.findAllDefects(search, isActive, pageable);
        return ResponseEntity.ok(defects);
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<AOIDefectDto>> getActiveDefects() {
        List<AOIDefectDto> defects = defectService.findAllActiveDefects();
        return ResponseEntity.ok(defects);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AOIDefectDto> getDefectById(@PathVariable Long id) {
        return defectService.findDefectById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<AOIDefectDto> createDefect(@RequestBody AOIDefectPayload payload) {
        AOIDefectDto defect = defectService.createDefect(payload);
        return ResponseEntity.ok(defect);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AOIDefectDto> updateDefect(@PathVariable Long id, @RequestBody AOIDefectPayload payload) {
        try {
            AOIDefectDto defect = defectService.updateDefect(id, payload);
            return ResponseEntity.ok(defect);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDefect(@PathVariable Long id) {
        try {
            defectService.deleteDefect(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}