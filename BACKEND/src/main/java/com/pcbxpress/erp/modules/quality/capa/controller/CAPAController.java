package com.pcbxpress.erp.modules.quality.capa.controller;

import com.pcbxpress.erp.modules.quality.capa.dto.CAPADto;
import com.pcbxpress.erp.modules.quality.capa.dto.CAPAPayload;
import com.pcbxpress.erp.modules.quality.capa.service.CAPAService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quality/capa")
@CrossOrigin(origins = "*")
public class CAPAController {
    
    @Autowired
    private CAPAService capaService;
    
    @GetMapping
    public ResponseEntity<Page<CAPADto>> getAllCAPAs(
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String severity,
        @RequestParam(required = false) String source,
        @RequestParam(required = false) String owner,
        @RequestParam(required = false) String from,
        @RequestParam(required = false) String to,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CAPADto> capas = capaService.findAllCAPAs(search, status, severity, source, owner, from, to, pageable);
        return ResponseEntity.ok(capas);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CAPADto> getCAPAById(@PathVariable Long id) {
        return capaService.findCAPAById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/capa-no/{capaNo}")
    public ResponseEntity<CAPADto> getCAPAByCapaNo(@PathVariable String capaNo) {
        return capaService.findCAPAByCapaNo(capaNo)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<CAPADto> createCAPA(@RequestBody CAPAPayload payload) {
        CAPADto capa = capaService.createCAPA(payload, "system"); // TODO: Get actual user
        return ResponseEntity.ok(capa);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CAPADto> updateCAPA(@PathVariable Long id, @RequestBody CAPAPayload payload) {
        try {
            CAPADto capa = capaService.updateCAPA(id, payload);
            return ResponseEntity.ok(capa);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCAPA(@PathVariable Long id) {
        try {
            capaService.deleteCAPA(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{id}/status")
    public ResponseEntity<CAPADto> updateCAPAStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            CAPADto capa = capaService.updateStatus(id, status);
            return ResponseEntity.ok(capa);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/overdue")
    public ResponseEntity<List<CAPADto>> getOverdueCAPAs() {
        List<CAPADto> overdue = capaService.findOverdueCAPAs();
        return ResponseEntity.ok(overdue);
    }
}