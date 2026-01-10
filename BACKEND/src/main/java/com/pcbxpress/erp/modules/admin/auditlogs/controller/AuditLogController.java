package com.pcbxpress.erp.modules.admin.auditlogs.controller;

import com.pcbxpress.erp.modules.admin.auditlogs.dto.AuditLogDto;
import com.pcbxpress.erp.modules.admin.auditlogs.dto.AuditLogPayload;
import com.pcbxpress.erp.modules.admin.auditlogs.model.AuditLog;
import com.pcbxpress.erp.modules.admin.auditlogs.service.AuditLogService;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Admin Audit Logs
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
public class AuditLogController {
    
    private final AuditLogService auditLogService;
    
    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }
    
    /**
     * List audit logs with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String module = params.get("module");
        String action = params.get("action");
        String severityStr = params.get("severity");
        String actor = params.get("actor");
        String entity = params.get("entity");
        String from = params.get("from");
        String to = params.get("to");
        
        AuditLog.Severity severity = severityStr != null ? AuditLog.Severity.valueOf(severityStr.toUpperCase()) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<AuditLogDto> filtered = auditLogService.list(query, module, action, severity, actor, entity, from, to, page, size);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<AuditLogDto> logs = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "items", logs,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single audit log by ID
     */
    @GetMapping("/{id}")
    public AuditLogDto get(@PathVariable String id) {
        return auditLogService.get(id);
    }
    
    /**
     * Create a new audit log
     */
    @PostMapping
    public ResponseEntity<AuditLogDto> create(@RequestBody AuditLogPayload payload) {
        AuditLogDto created = auditLogService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Delete an audit log
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        auditLogService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Delete audit logs older than specified date
     */
    @DeleteMapping("/purge")
    public ResponseEntity<Void> purgeOlderThan(@RequestParam String cutoff) {
        OffsetDateTime cutoffTime = OffsetDateTime.parse(cutoff);
        auditLogService.deleteOlderThan(cutoffTime);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Search audit logs
     */
    @GetMapping("/search")
    public List<AuditLogDto> search(@RequestParam String q) {
        return auditLogService.search(q);
    }
    
    /**
     * Export audit logs to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String module = params.get("module");
        String action = params.get("action");
        String severityStr = params.get("severity");
        String actor = params.get("actor");
        String entity = params.get("entity");
        String from = params.get("from");
        String to = params.get("to");
        
        AuditLog.Severity severity = severityStr != null ? AuditLog.Severity.valueOf(severityStr.toUpperCase()) : null;
        
        List<AuditLogDto> data = auditLogService.list(query, module, action, severity, actor, entity, from, to, 1, 10000);
        String csv = auditLogService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit_logs.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get audit log statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return auditLogService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}