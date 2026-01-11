package com.pcbxpress.erp.modules.procurement.suppliers.controller;

import com.pcbxpress.erp.modules.procurement.suppliers.dto.SupplierDto;
import com.pcbxpress.erp.modules.procurement.suppliers.dto.SupplierPayload;
import com.pcbxpress.erp.modules.procurement.suppliers.service.SupplierService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/procurement/suppliers")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String status = params.get("status");
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);

        List<SupplierDto> filtered = supplierService.list(query, status);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<SupplierDto> items = filtered.subList(fromIndex, toIndex);

        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }

    @GetMapping("/{id}")
    public SupplierDto get(@PathVariable String id) {
        return supplierService.get(id);
    }

    @PostMapping
    public ResponseEntity<SupplierDto> create(@RequestBody SupplierPayload payload) {
        SupplierDto created = supplierService.create(payload);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    public SupplierDto update(@PathVariable String id, @RequestBody SupplierPayload payload) {
        return supplierService.update(id, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        supplierService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<SupplierDto> data = supplierService.list(params.get("q"), params.get("status"));
        String csv = supplierService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=suppliers.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return supplierService.stats();
    }

    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}