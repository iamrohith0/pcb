package com.pcbxpress.erp.modules.sales.quotation.controller;

import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationDto;
import com.pcbxpress.erp.modules.sales.quotation.dto.QuotationPayload;
import com.pcbxpress.erp.modules.sales.quotation.service.QuotationService;
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

@RestController
@RequestMapping("/sales/quotations")
public class QuotationController {

    private final QuotationService quotationService;

    public QuotationController(QuotationService quotationService) {
        this.quotationService = quotationService;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String q = params.get("q");
        String status = params.get("status");
        int page = parseInt(params.get("page"), 1);
        int limit = parseInt(params.get("limit"), 10);

        List<QuotationDto> filtered = quotationService.list(q, status);
        int total = filtered.size();
        int pages = Math.max(1, (int) Math.ceil((double) total / limit));
        int from = Math.min(Math.max(0, (page - 1) * limit), total);
        int to = Math.min(from + limit, total);
        List<QuotationDto> items = filtered.subList(from, to);

        return Map.of(
            "data", items,
            "items", items,
            "meta", Map.of(
                "page", page,
                "limit", limit,
                "total", total,
                "pages", pages
            )
        );
    }

    @GetMapping("/{id}")
    public Map<String, Object> get(@PathVariable String id) {
        QuotationDto dto = quotationService.get(id);
        return Map.of("data", dto);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(@RequestBody QuotationPayload payload) {
        QuotationDto created = quotationService.create(payload);
        return ResponseEntity.status(201).body(Map.of("data", created));
    }

    @PutMapping("/{id}")
    public Map<String, Object> update(@PathVariable String id, @RequestBody QuotationPayload payload) {
        QuotationDto updated = quotationService.update(id, payload);
        return Map.of("data", updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        quotationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/note")
    public Map<String, Object> updateNote(@PathVariable String id, @RequestBody Map<String, String> body) {
        String note = body.getOrDefault("note", body.getOrDefault("internalNote", ""));
        QuotationDto updated = quotationService.updateNote(id, note);
        return Map.of("data", updated);
    }

    @PostMapping("/{id}/send")
    public Map<String, Object> sendToCustomer(@PathVariable String id) {
        QuotationDto updated = quotationService.markSent(id);
        return Map.of("data", updated, "message", "Quotation sent to customer");
    }

    @PostMapping("/{id}/convert")
    public Map<String, Object> convertToSalesOrder(@PathVariable String id) {
        Map<String, Object> conversion = quotationService.convertToSalesOrder(id);
        return Map.of(
            "message", "Quotation converted to sales order",
            "data", conversion
        );
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<ByteArrayResource> downloadPdf(@PathVariable String id) {
        QuotationDto dto = quotationService.get(id);
        String content = "Quotation PDF placeholder for " + dto.quoteNo();
        ByteArrayResource resource = new ByteArrayResource(content.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=quotation-" + dto.quoteNo() + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(resource.contentLength())
            .body(resource);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<QuotationDto> data = quotationService.list(params.get("q"), params.get("status"));
        String csv = quotationService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=quotations.csv")
            .contentType(MediaType.parseMediaType("text/csv"))
            .contentLength(resource.contentLength())
            .body(resource);
    }

    private static int parseInt(String raw, int defaultValue) {
        try {
            return raw != null ? Integer.parseInt(raw) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}
