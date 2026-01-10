package com.pcbxpress.erp.modules.admin.roles.controller;

import com.pcbxpress.erp.modules.admin.roles.dto.RoleDto;
import com.pcbxpress.erp.modules.admin.roles.dto.RolePayload;
import com.pcbxpress.erp.modules.admin.roles.model.Role;
import com.pcbxpress.erp.modules.admin.roles.service.RoleService;
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
 * REST Controller for Admin Roles
 */
@RestController
@RequestMapping("/api/admin/roles")
public class RoleController {
    
    private final RoleService roleService;
    
    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }
    
    /**
     * List roles with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String roleTypeStr = params.get("roleType");
        String status = params.get("status");
        
        Role.RoleType roleType = roleTypeStr != null ? Role.RoleType.valueOf(roleTypeStr.toUpperCase()) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<RoleDto> filtered = roleService.list(query, roleType, status);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<RoleDto> roles = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "items", roles,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single role by ID
     */
    @GetMapping("/{id}")
    public RoleDto get(@PathVariable String id) {
        return roleService.get(id);
    }
    
    /**
     * Create a new role
     */
    @PostMapping
    public ResponseEntity<RoleDto> create(@RequestBody RolePayload payload) {
        RoleDto created = roleService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing role
     */
    @PutMapping("/{id}")
    public RoleDto update(@PathVariable String id, @RequestBody RolePayload payload) {
        return roleService.update(id, payload);
    }
    
    /**
     * Delete a role
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete roles
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        roleService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Toggle role active status
     */
    @PutMapping("/{id}/status")
    public RoleDto toggleStatus(@PathVariable String id) {
        return roleService.toggleStatus(id);
    }
    
    /**
     * Search roles
     */
    @GetMapping("/search")
    public List<RoleDto> search(@RequestParam String q) {
        return roleService.search(q);
    }
    
    /**
     * Export roles to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<RoleDto> data = roleService.list(params.get("q"), 
            params.get("roleType") != null ? Role.RoleType.valueOf(params.get("roleType").toUpperCase()) : null,
            params.get("status"));
        String csv = roleService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=roles.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get role statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return roleService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}