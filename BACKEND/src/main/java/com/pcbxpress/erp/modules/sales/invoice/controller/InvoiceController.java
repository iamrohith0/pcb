package com.pcbxpress.erp.modules.sales.invoice.controller;

import com.pcbxpress.erp.modules.sales.invoice.dto.InvoiceDto;
import com.pcbxpress.erp.modules.sales.invoice.dto.InvoicePayload;
import com.pcbxpress.erp.modules.sales.invoice.service.InvoiceService;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.format.annotation.DateTimeFormat;
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

@RestController
@RequestMapping("/sales/invoices")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public Map<String, Object> list(
        @RequestParam(name = "q", required = false) String query,
        @RequestParam(name = "status", required = false) String status,
        @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
        @RequestParam(name = "page", defaultValue = "1") int page,
        @RequestParam(name = "limit", defaultValue = "20") int limit
    ) {
        List<InvoiceDto> filtered = invoiceService.list(query, status, from, to);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / limit));
        int fromIndex = Math.min(Math.max(0, (page - 1) * limit), total);
        int toIndex = Math.min(fromIndex + limit, total);
        List<InvoiceDto> items = filtered.subList(fromIndex, toIndex);

        return Map.of(
            "data", Map.of(
                "items", items,
                "page", page,
                "limit", limit,
                "total", total,
                "totalPages", totalPages
            ),
            "items", items,
            "page", page,
            "limit", limit,
            "total", total,
            "totalPages", totalPages
        );
    }

    @GetMapping("/next-number")
    public Map<String, String> nextNumber() {
        return Map.of("next", invoiceService.nextNumber());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody InvoicePayload payload) {
        InvoiceDto created = invoiceService.create(payload);
        return ResponseEntity.status(201).body(Map.of("data", created));
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable String id) {
        InvoiceDto dto = invoiceService.get(id);
        return Map.of("data", dto);
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable String id, @RequestBody InvoicePayload payload) {
        InvoiceDto updated = invoiceService.update(id, payload);
        return Map.of("data", updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        invoiceService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/mark-sent")
    public Map<String, Object> markSent(@PathVariable String id) {
        InvoiceDto updated = invoiceService.markSent(id);
        return Map.of("data", updated, "message", "Invoice marked as sent");
    }

    @PostMapping("/{id}/mark-paid")
    public Map<String, Object> markPaid(@PathVariable String id) {
        InvoiceDto updated = invoiceService.markPaid(id);
        return Map.of("data", updated, "message", "Invoice marked as paid");
    }

    @PostMapping("/{id}/cancel")
    public Map<String, Object> cancel(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        InvoiceDto updated = invoiceService.cancel(id, reason);
        return Map.of("data", updated, "message", "Invoice cancelled");
    }

    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(
        @RequestParam(name = "q", required = false) String query,
        @RequestParam(name = "status", required = false) String status
    ) {
        List<InvoiceDto> data = invoiceService.list(query, status, null, null);
        String csv = invoiceService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoices.csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .contentLength(resource.contentLength())
            .body(resource);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<ByteArrayResource> pdf(@PathVariable String id) {
        InvoiceDto dto = invoiceService.get(id);
        String content = "Invoice PDF placeholder for " + dto.invoiceNo();
        ByteArrayResource resource = new ByteArrayResource(content.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + dto.invoiceNo() + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(resource.contentLength())
            .body(resource);
    }

    @PostMapping("/{id}/send-email")
    public Map<String, Object> sendEmail(@PathVariable String id, @RequestBody(required = false) Map<String, Object> body) {
        InvoiceDto dto = invoiceService.get(id);
        return Map.of(
            "data", dto,
            "message", "Invoice email queued"
        );
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return invoiceService.stats();
    }
}
