package com.pcbxpress.erp.modules.traceability.genealogy.controller;

import com.pcbxpress.erp.modules.traceability.genealogy.dto.LotGenealogyDto;
import com.pcbxpress.erp.modules.traceability.genealogy.dto.LotGenealogyPayload;
import com.pcbxpress.erp.modules.traceability.genealogy.model.LotGenealogy;
import com.pcbxpress.erp.modules.traceability.genealogy.service.LotGenealogyService;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
 * REST Controller for Lot Genealogy Management
 */
@RestController
@RequestMapping("/api/traceability/genealogy")
public class LotGenealogyController {
    
    private final LotGenealogyService genealogyService;
    
    public LotGenealogyController(LotGenealogyService genealogyService) {
        this.genealogyService = genealogyService;
    }
    
    /**
     * List genealogy records with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String parentLotId = params.get("parentLotId");
        String childLotId = params.get("childLotId");
        String componentId = params.get("componentId");
        String relationshipTypeStr = params.get("relationshipType");
        String activeStr = params.get("active");
        
        LotGenealogy.RelationshipType relationshipType = relationshipTypeStr != null ? 
            LotGenealogy.RelationshipType.valueOf(relationshipTypeStr.toUpperCase()) : null;
        Boolean isActive = activeStr != null ? Boolean.parseBoolean(activeStr) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<LotGenealogyDto> filtered = genealogyService.list(query, parentLotId, childLotId, 
            componentId, relationshipType, isActive, page, size);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<LotGenealogyDto> records = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "records", records,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single genealogy record by ID
     */
    @GetMapping("/{id}")
    public LotGenealogyDto get(@PathVariable String id) {
        return genealogyService.get(id);
    }
    
    /**
     * Create a new genealogy record
     */
    @PostMapping
    public ResponseEntity<LotGenealogyDto> create(@RequestBody LotGenealogyPayload payload) {
        LotGenealogyDto created = genealogyService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing genealogy record
     */
    @PutMapping("/{id}")
    public LotGenealogyDto update(@PathVariable String id, @RequestBody LotGenealogyPayload payload) {
        return genealogyService.update(id, payload);
    }
    
    /**
     * Delete a genealogy record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        genealogyService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete genealogy records
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        genealogyService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search genealogy records
     */
    @GetMapping("/search")
    public List<LotGenealogyDto> search(@RequestParam String q) {
        return genealogyService.search(q);
    }
    
    /**
     * Get lot genealogy
     */
    @GetMapping("/lot/{lotId}")
    public List<LotGenealogyDto> getLotGenealogy(@PathVariable String lotId, 
                                                @RequestParam(required = false) String relationshipType) {
        return genealogyService.getLotGenealogy(lotId, relationshipType);
    }
    
    /**
     * Get component linking
     */
    @GetMapping("/component/{componentId}")
    public List<LotGenealogyDto> getComponentLinking(@PathVariable String componentId,
                                                   @RequestParam(required = false) String relationshipType) {
        return genealogyService.getComponentLinking(componentId, relationshipType);
    }
    
    /**
     * Get supplier trace
     */
    @GetMapping("/supplier/{supplierId}")
    public List<LotGenealogyDto> getSupplierTrace(@PathVariable String supplierId,
                                                @RequestParam(required = false) String relationshipType) {
        return genealogyService.getSupplierTrace(supplierId, relationshipType);
    }
    
    /**
     * Link components
     */
    @PostMapping("/link")
    public ResponseEntity<LotGenealogyDto> linkComponents(@RequestBody LotGenealogyPayload payload) {
        LotGenealogyDto linked = genealogyService.linkComponents(payload);
        return ResponseEntity.status(201).body(linked);
    }
    
    /**
     * Unlink components
     */
    @DeleteMapping("/unlink/{id}")
    public ResponseEntity<Void> unlinkComponents(@PathVariable String id) {
        genealogyService.unlinkComponents(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get genealogy tree
     */
    @GetMapping("/{lotId}/tree")
    public List<LotGenealogyDto> getGenealogyTree(@PathVariable String lotId) {
        return genealogyService.getGenealogyTree(lotId);
    }
    
    /**
     * Get upstream traceability
     */
    @GetMapping("/{lotId}/upstream")
    public List<LotGenealogyDto> getUpstreamTraceability(@PathVariable String lotId) {
        return genealogyService.getUpstreamTraceability(lotId);
    }
    
    /**
     * Get downstream traceability
     */
    @GetMapping("/{lotId}/downstream")
    public List<LotGenealogyDto> getDownstreamTraceability(@PathVariable String lotId) {
        return genealogyService.getDownstreamTraceability(lotId);
    }
    
    /**
     * Get traceability report
     */
    @GetMapping("/{lotId}/report")
    public Map<String, Object> getTraceabilityReport(@PathVariable String lotId) {
        return genealogyService.getTraceabilityReport(lotId);
    }
    
    /**
     * Export genealogy records to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<LotGenealogyDto> data = genealogyService.list(params.get("q"), params.get("parentLotId"), 
            params.get("childLotId"), params.get("componentId"), 
            params.get("relationshipType") != null ? LotGenealogy.RelationshipType.valueOf(params.get("relationshipType").toUpperCase()) : null,
            params.get("active") != null ? Boolean.parseBoolean(params.get("active")) : null,
            parseInt(params.get("page"), 1), parseInt(params.getOrDefault("size", params.get("limit")), 20));
        String csv = exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=genealogy.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get genealogy statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return genealogyService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
    
    private static String exportCsv(List<LotGenealogyDto> data) {
        String header = "Parent Lot ID,Child Lot ID,Component ID,Relationship Type,Quantity Used,Unit of Measure,Production Date,Supplier ID,Warehouse ID,Location,Active";
        String rows = data.stream()
            .map(record -> String.join(",",
                safe(record.parentLotId()),
                safe(record.childLotId()),
                safe(record.componentId()),
                safe(record.relationshipType() != null ? record.relationshipType().toString() : ""),
                safe(record.quantityUsed() != null ? record.quantityUsed().toString() : ""),
                safe(record.unitOfMeasure()),
                safe(record.productionDate() != null ? record.productionDate().toString() : ""),
                safe(record.supplierId()),
                safe(record.warehouseId()),
                safe(record.location()),
                record.isActive() ? "Yes" : "No"
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
}