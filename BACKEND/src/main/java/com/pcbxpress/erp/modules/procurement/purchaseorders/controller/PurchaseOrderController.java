package com.pcbxpress.erp.modules.procurement.purchaseorders.controller;

import com.pcbxpress.erp.modules.procurement.purchaseorders.dto.PurchaseOrderDto;
import com.pcbxpress.erp.modules.procurement.purchaseorders.dto.PurchaseOrderPayload;
import com.pcbxpress.erp.modules.procurement.purchaseorders.service.PurchaseOrderService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/procurement/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String status = params.get("status");
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);

        List<PurchaseOrderDto> filtered = purchaseOrderService.list(query, status);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<PurchaseOrderDto> items = filtered.subList(fromIndex, toIndex);

        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }

    @GetMapping("/{id}")
    public PurchaseOrderDto get(@PathVariable String id) {
        return purchaseOrderService.get(id);
    }

    @PostMapping
    public ResponseEntity<PurchaseOrderDto> create(@RequestBody PurchaseOrderPayload payload) {
        PurchaseOrderDto created = purchaseOrderService.create(payload);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    public PurchaseOrderDto update(@PathVariable String id, @RequestBody PurchaseOrderPayload payload) {
        return purchaseOrderService.update(id, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        purchaseOrderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        purchaseOrderService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<PurchaseOrderDto> data = purchaseOrderService.list(params.get("q"), params.get("status"));
        String csv = purchaseOrderService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=purchase_orders.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return purchaseOrderService.stats();
    }

    @PostMapping("/{id}/approve")
    public PurchaseOrderDto approve(@PathVariable String id) {
        purchaseOrderService.approve(id);
        return purchaseOrderService.get(id);
    }

    @PostMapping("/{id}/send")
    public PurchaseOrderDto sendToSupplier(@PathVariable String id) {
        purchaseOrderService.sendToSupplier(id);
        return purchaseOrderService.get(id);
    }

    @PostMapping("/{id}/receive")
    public PurchaseOrderDto markAsReceived(@PathVariable String id) {
        purchaseOrderService.markAsReceived(id);
        return purchaseOrderService.get(id);
    }

    @PostMapping("/{id}/close")
    public PurchaseOrderDto close(@PathVariable String id) {
        purchaseOrderService.close(id);
        return purchaseOrderService.get(id);
    }

    @PostMapping("/{id}/cancel")
    public PurchaseOrderDto cancel(@PathVariable String id) {
        purchaseOrderService.cancel(id);
        return purchaseOrderService.get(id);
    }

    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}