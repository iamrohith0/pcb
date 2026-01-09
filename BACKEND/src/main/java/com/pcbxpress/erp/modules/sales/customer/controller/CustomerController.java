package com.pcbxpress.erp.modules.sales.customer.controller;

import com.pcbxpress.erp.modules.sales.customer.dto.CustomerDto;
import com.pcbxpress.erp.modules.sales.customer.dto.CustomerPayload;
import com.pcbxpress.erp.modules.sales.customer.service.CustomerService;
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
@RequestMapping("/sales/customers")
public class CustomerController {

    private final CustomerService customerService;

    public CustomerController(CustomerService customerService) {
        this.customerService = customerService;
    }

    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String status = params.get("status");
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);

        List<CustomerDto> filtered = customerService.list(query, status);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<CustomerDto> items = filtered.subList(fromIndex, toIndex);

        return Map.of(
            "items", items,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }

    @GetMapping("/{id}")
    public CustomerDto get(@PathVariable String id) {
        return customerService.get(id);
    }

    @PostMapping
    public ResponseEntity<CustomerDto> create(@RequestBody CustomerPayload payload) {
        CustomerDto created = customerService.create(payload);
        return ResponseEntity.status(201).body(created);
    }

    @PutMapping("/{id}")
    public CustomerDto update(@PathVariable String id, @RequestBody CustomerPayload payload) {
        return customerService.update(id, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        customerService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        customerService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<CustomerDto> data = customerService.list(params.get("q"), params.get("status"));
        String csv = customerService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=customers.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return customerService.stats();
    }

    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}
