package com.pcbxpress.erp.modules.procurement.pricing.controller;

import com.pcbxpress.erp.modules.procurement.pricing.dto.SupplierPricingDto;
import com.pcbxpress.erp.modules.procurement.pricing.dto.SupplierPricingPayload;
import com.pcbxpress.erp.modules.procurement.pricing.service.SupplierPricingService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/procurement/pricing")
public class SupplierPricingController {

    private final SupplierPricingService supplierPricingService;

    public SupplierPricingController(SupplierPricingService supplierPricingService) {
        this.supplierPricingService = supplierPricingService;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String status = params.get("status");
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);

        List<SupplierPricingDto> filtered = supplierPricingService.list(query, status);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<SupplierPricingDto> items = filtered.subList(fromIndex, toIndex);

        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }

    @GetMapping("/{id}")
    public SupplierPricingDto get(@PathVariable String id) {
        return supplierPricingService.get(id);
    }

    @PostMapping
    public ResponseEntity<SupplierPricingDto> create(@RequestBody SupplierPricingPayload payload) {
        SupplierPricingDto created = supplierPricingService.create(payload);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    public SupplierPricingDto update(@PathVariable String id, @RequestBody SupplierPricingPayload payload) {
        return supplierPricingService.update(id, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierPricingService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        supplierPricingService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<SupplierPricingDto> data = supplierPricingService.list(params.get("q"), params.get("status"));
        String csv = supplierPricingService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=supplier_pricing.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return supplierPricingService.stats();
    }

    @GetMapping("/supplier/{supplierId}")
    public List<SupplierPricingDto> findBySupplier(@PathVariable String supplierId) {
        return supplierPricingService.findBySupplier(supplierId);
    }

    @GetMapping("/item/{itemId}")
    public List<SupplierPricingDto> findByItem(@PathVariable String itemId) {
        return supplierPricingService.findByItem(itemId);
    }

    @GetMapping("/item/{itemId}/active")
    public List<SupplierPricingDto> findActiveByItem(@PathVariable String itemId) {
        return supplierPricingService.findActiveByItem(itemId);
    }

    @GetMapping("/item/{itemId}/best-price")
    public SupplierPricingDto findBestPriceForItem(@PathVariable String itemId) {
        return supplierPricingService.findBestPriceForItem(itemId);
    }

    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}