package com.pcbxpress.erp.modules.sales.salesorder.controller;

import com.pcbxpress.erp.modules.sales.salesorder.dto.SalesOrderDto;
import com.pcbxpress.erp.modules.sales.salesorder.dto.SalesOrderItemDto;
import com.pcbxpress.erp.modules.sales.salesorder.dto.SalesOrderPayload;
import com.pcbxpress.erp.modules.sales.salesorder.service.SalesOrderService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sales/orders")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    public SalesOrderController(SalesOrderService salesOrderService) {
        this.salesOrderService = salesOrderService;
    }

    @GetMapping
    public Map<String, Object> list(
        @RequestParam(name = "q", required = false) String query,
        @RequestParam(name = "status", required = false) String status,
        @RequestParam(name = "date_from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(name = "date_to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(name = "page", defaultValue = "1") int page,
        @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        List<SalesOrderDto> filtered = salesOrderService.list(query, status, from, to);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / limit));
        int fromIndex = Math.min(Math.max(0, (page - 1) * limit), total);
        int toIndex = Math.min(fromIndex + limit, total);
        List<SalesOrderDto> items = filtered.subList(fromIndex, toIndex);

        return Map.of(
            "items", items,
            "data", items,
            "meta", Map.of(
                "page", page,
                "limit", limit,
                "total", total,
                "totalPages", totalPages
            )
        );
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable String id) {
        SalesOrderDto dto = salesOrderService.get(id);
        return Map.of("order", dto);
    }

    @PostMapping
    public ResponseEntity<SalesOrderDto> create(@RequestBody SalesOrderPayload payload) {
        SalesOrderDto created = salesOrderService.create(payload);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    public SalesOrderDto update(@PathVariable String id, @RequestBody SalesOrderPayload payload) {
        return salesOrderService.update(id, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        salesOrderService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public SalesOrderDto updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", body.getOrDefault("state", "Draft"));
        return salesOrderService.updateStatus(id, status);
    }

    @GetMapping("/{id}/items")
    public List<SalesOrderItemDto> getItems(@PathVariable String id) {
        return salesOrderService.items(id);
    }

    @PostMapping("/{id}/items")
    public SalesOrderDto addItem(@PathVariable String id, @RequestBody SalesOrderItemDto item) {
        SalesOrderItemDto withId = item.id() != null ? item : new SalesOrderItemDto(
            UUID.randomUUID().toString(),
            item.sku(),
            item.description(),
            item.qty(),
            item.uom(),
            item.unitPrice(),
            item.taxPct(),
            item.leadTimeDays()
        );
        return salesOrderService.addItem(id, withId);
    }

    @PutMapping("/{orderId}/items/{itemId}")
    public SalesOrderDto updateItem(
        @PathVariable String orderId,
        @PathVariable String itemId,
        @RequestBody SalesOrderItemDto item
    ) {
        SalesOrderItemDto withId = new SalesOrderItemDto(
            itemId,
            item.sku(),
            item.description(),
            item.qty(),
            item.uom(),
            item.unitPrice(),
            item.taxPct(),
            item.leadTimeDays()
        );
        return salesOrderService.updateItem(orderId, itemId, withId);
    }

    @DeleteMapping("/{orderId}/items/{itemId}")
    public SalesOrderDto removeItem(@PathVariable String orderId, @PathVariable String itemId) {
        return salesOrderService.removeItem(orderId, itemId);
    }

    @GetMapping("/{id}/history")
    public List<Map<String, Object>> history(@PathVariable String id) {
        return salesOrderService.history(id);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(
        @RequestParam(name = "q", required = false) String query,
        @RequestParam(name = "status", required = false) String status
    ) {
        List<SalesOrderDto> data = salesOrderService.list(query, status, null, null);
        String csv = salesOrderService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sales-orders.csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .contentLength(resource.contentLength())
            .body(resource);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return salesOrderService.stats();
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<ByteArrayResource> pdf(@PathVariable String id) {
        SalesOrderDto dto = salesOrderService.get(id);
        String content = "Sales Order PDF placeholder for " + dto.orderNo();
        ByteArrayResource resource = new ByteArrayResource(content.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=sales-order-" + dto.orderNo() + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(resource.contentLength())
            .body(resource);
    }
}
