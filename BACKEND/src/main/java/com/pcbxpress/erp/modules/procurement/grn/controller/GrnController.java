package com.pcbxpress.erp.modules.procurement.grn.controller;

import com.pcbxpress.erp.modules.procurement.grn.dto.GrnDto;
import com.pcbxpress.erp.modules.procurement.grn.dto.GrnPayload;
import com.pcbxpress.erp.modules.procurement.grn.service.GrnService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/procurement/grn")
public class GrnController {

    private final GrnService grnService;

    public GrnController(GrnService grnService) {
        this.grnService = grnService;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String status = params.get("status");
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);

        List<GrnDto> filtered = grnService.list(query, status);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<GrnDto> items = filtered.subList(fromIndex, toIndex);

        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }

    @GetMapping("/{id}")
    public GrnDto get(@PathVariable String id) {
        return grnService.get(id);
    }

    @PostMapping
    public ResponseEntity<GrnDto> create(@RequestBody GrnPayload payload) {
        GrnDto created = grnService.create(payload);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    public GrnDto update(@PathVariable String id, @RequestBody GrnPayload payload) {
        return grnService.update(id, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        grnService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        grnService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<GrnDto> data = grnService.list(params.get("q"), params.get("status"));
        String csv = grnService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=grns.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return grnService.stats();
    }

    @PostMapping("/{id}/qc-pass")
    public GrnDto markQcPassed(@PathVariable String id, @RequestParam(required = false) String remarks) {
        grnService.markQcPassed(id, remarks);
        return grnService.get(id);
    }

    @PostMapping("/{id}/qc-fail")
    public GrnDto markQcFailed(@PathVariable String id, @RequestParam String remarks) {
        grnService.markQcFailed(id, remarks);
        return grnService.get(id);
    }

    @PostMapping("/{id}/putaway")
    public GrnDto markPutawayCompleted(@PathVariable String id) {
        grnService.markPutawayCompleted(id);
        return grnService.get(id);
    }

    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}