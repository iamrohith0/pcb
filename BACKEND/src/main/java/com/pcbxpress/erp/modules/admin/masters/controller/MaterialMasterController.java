package com.pcbxpress.erp.modules.admin.masters.controller;

import com.pcbxpress.erp.modules.admin.masters.dto.MaterialMasterDto;
import com.pcbxpress.erp.modules.admin.masters.dto.MaterialMasterPayload;
import com.pcbxpress.erp.modules.admin.masters.model.MaterialMaster;
import com.pcbxpress.erp.modules.admin.masters.service.MaterialMasterService;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

/**
 * REST Controller for Admin Material Master
 */
@RestController
@RequestMapping("/api/admin/masters/materials")
public class MaterialMasterController {
    
    private final MaterialMasterService materialMasterService;
    
    public MaterialMasterController(MaterialMasterService materialMasterService) {
        this.materialMasterService = materialMasterService;
    }
    
    /**
     * List materials with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String materialTypeStr = params.get("type");
        String statusStr = params.get("status");
        String unitOfMeasure = params.get("uom");
        String preferredVendor = params.get("vendor");
        String minThicknessStr = params.get("minThickness");
        String maxThicknessStr = params.get("maxThickness");
        
        MaterialMaster.MaterialType materialType = materialTypeStr != null ? MaterialMaster.MaterialType.valueOf(materialTypeStr.toUpperCase()) : null;
        MaterialMaster.Status status = statusStr != null ? MaterialMaster.Status.valueOf(statusStr.toUpperCase()) : null;
        
        BigDecimal minThickness = parseBigDecimal(minThicknessStr);
        BigDecimal maxThickness = parseBigDecimal(maxThicknessStr);
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<MaterialMasterDto> filtered = materialMasterService.list(query, materialType, status, unitOfMeasure, preferredVendor, minThickness, maxThickness);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<MaterialMasterDto> materials = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "items", materials,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single material by ID
     */
    @GetMapping("/{id}")
    public MaterialMasterDto get(@PathVariable String id) {
        return materialMasterService.get(id);
    }
    
    /**
     * Create a new material
     */
    @PostMapping
    public ResponseEntity<MaterialMasterDto> create(@RequestBody MaterialMasterPayload payload) {
        MaterialMasterDto created = materialMasterService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing material
     */
    @PutMapping("/{id}")
    public MaterialMasterDto update(@PathVariable String id, @RequestBody MaterialMasterPayload payload) {
        return materialMasterService.update(id, payload);
    }
    
    /**
     * Delete a material
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        materialMasterService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete materials
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        materialMasterService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search materials
     */
    @GetMapping("/search")
    public List<MaterialMasterDto> search(@RequestParam String q) {
        return materialMasterService.search(q);
    }
    
    /**
     * Export materials to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String materialTypeStr = params.get("type");
        String statusStr = params.get("status");
        String unitOfMeasure = params.get("uom");
        String preferredVendor = params.get("vendor");
        String minThicknessStr = params.get("minThickness");
        String maxThicknessStr = params.get("maxThickness");
        
        MaterialMaster.MaterialType materialType = materialTypeStr != null ? MaterialMaster.MaterialType.valueOf(materialTypeStr.toUpperCase()) : null;
        MaterialMaster.Status status = statusStr != null ? MaterialMaster.Status.valueOf(statusStr.toUpperCase()) : null;
        
        BigDecimal minThickness = parseBigDecimal(minThicknessStr);
        BigDecimal maxThickness = parseBigDecimal(maxThicknessStr);
        
        List<MaterialMasterDto> data = materialMasterService.list(query, materialType, status, unitOfMeasure, preferredVendor, minThickness, maxThickness);
        String csv = materialMasterService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=material_master.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get material statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return materialMasterService.getStats();
    }
    
    private static BigDecimal parseBigDecimal(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException ex) {
            return null;
        }
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}