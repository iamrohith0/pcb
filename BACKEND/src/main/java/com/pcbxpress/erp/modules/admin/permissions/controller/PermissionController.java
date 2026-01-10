package com.pcbxpress.erp.modules.admin.permissions.controller;

import com.pcbxpress.erp.modules.admin.permissions.dto.PermissionDto;
import com.pcbxpress.erp.modules.admin.permissions.dto.PermissionPayload;
import com.pcbxpress.erp.modules.admin.permissions.model.Permission;
import com.pcbxpress.erp.modules.admin.permissions.service.PermissionService;
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

/**
 * REST Controller for Permissions
 */
@RestController
@RequestMapping("/api/admin/permissions")
public class PermissionController {
    
    private final PermissionService permissionService;
    
    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }
    
    /**
     * List permissions with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String module = params.get("module");
        String permissionTypeStr = params.get("permissionType");
        String isSystemStr = params.get("isSystem");
        String isActiveStr = params.get("isActive");
        
        Permission.PermissionType permissionType = permissionTypeStr != null ? 
            Permission.PermissionType.valueOf(permissionTypeStr.toUpperCase()) : null;
        Boolean isSystem = isSystemStr != null ? Boolean.parseBoolean(isSystemStr) : null;
        Boolean isActive = isActiveStr != null ? Boolean.parseBoolean(isActiveStr) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<PermissionDto> filtered = permissionService.list(query, module, permissionType, isSystem, isActive);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<PermissionDto> permissions = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "items", permissions,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single permission by ID
     */
    @GetMapping("/{id}")
    public PermissionDto get(@PathVariable String id) {
        return permissionService.get(id);
    }
    
    /**
     * Create a new permission
     */
    @PostMapping
    public ResponseEntity<PermissionDto> create(@RequestBody PermissionPayload payload) {
        PermissionDto created = permissionService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing permission
     */
    @PutMapping("/{id}")
    public PermissionDto update(@PathVariable String id, @RequestBody PermissionPayload payload) {
        return permissionService.update(id, payload);
    }
    
    /**
     * Delete a permission
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        permissionService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete permissions
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        permissionService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Toggle permission active status
     */
    @PutMapping("/{id}/toggle")
    public PermissionDto toggleStatus(@PathVariable String id) {
        return permissionService.toggleStatus(id);
    }
    
    /**
     * Search permissions
     */
    @GetMapping("/search")
    public List<PermissionDto> search(@RequestParam String q) {
        return permissionService.search(q);
    }
    
    /**
     * Get permissions by module
     */
    @GetMapping("/module/{module}")
    public List<PermissionDto> getByModule(@PathVariable String module) {
        return permissionService.getByModule(module);
    }
    
    /**
     * Get active permissions by module
     */
    @GetMapping("/module/{module}/active")
    public List<PermissionDto> getActiveByModule(@PathVariable String module) {
        return permissionService.getActiveByModule(module);
    }
    
    /**
     * Get system permissions
     */
    @GetMapping("/system")
    public List<PermissionDto> getSystemPermissions() {
        return permissionService.getSystemPermissions();
    }
    
    /**
     * Get custom permissions
     */
    @GetMapping("/custom")
    public List<PermissionDto> getCustomPermissions() {
        return permissionService.getCustomPermissions();
    }
    
    /**
     * Get all modules
     */
    @GetMapping("/modules")
    public List<String> getAllModules() {
        return permissionService.getAllModules();
    }
    
    /**
     * Get all operations
     */
    @GetMapping("/operations")
    public List<String> getAllOperations() {
        return permissionService.getAllOperations();
    }
    
    /**
     * Export permissions to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<PermissionDto> data = permissionService.list(params.get("q"),
            params.get("module"),
            params.get("permissionType") != null ? Permission.PermissionType.valueOf(params.get("permissionType").toUpperCase()) : null,
            params.get("isSystem") != null ? Boolean.parseBoolean(params.get("isSystem")) : null,
            params.get("isActive") != null ? Boolean.parseBoolean(params.get("isActive")) : null);
        String csv = permissionService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=permissions.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get permission statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return permissionService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}