package com.pcbxpress.erp.modules.admin.users.controller;

import com.pcbxpress.erp.modules.admin.users.dto.UserDto;
import com.pcbxpress.erp.modules.admin.users.dto.UserPayload;
import com.pcbxpress.erp.modules.admin.users.model.User;
import com.pcbxpress.erp.modules.admin.users.service.UserService;
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
 * REST Controller for Admin Users
 */
@RestController
@RequestMapping("/api/admin/users")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    /**
     * List users with optional filters
     */
    @GetMapping
    public Map<String, Object> list(@RequestParam Map<String, String> params) {
        String query = params.get("q");
        String roleStr = params.get("role");
        String status = params.get("status");
        
        User.Role role = roleStr != null ? User.Role.valueOf(roleStr.toUpperCase()) : null;
        
        int page = parseInt(params.get("page"), 1);
        int size = parseInt(params.getOrDefault("size", params.get("limit")), 20);
        
        List<UserDto> filtered = userService.list(query, role, status);
        int total = filtered.size();
        int totalPages = Math.max(1, (int) Math.ceil((double) total / size));
        int fromIndex = Math.min(Math.max(0, (page - 1) * size), total);
        int toIndex = Math.min(fromIndex + size, total);
        List<UserDto> users = filtered.subList(fromIndex, toIndex);
        
        return Map.of(
            "items", users,
            "page", page,
            "size", size,
            "total", total,
            "totalPages", totalPages
        );
    }
    
    /**
     * Get a single user by ID
     */
    @GetMapping("/{id}")
    public UserDto get(@PathVariable String id) {
        return userService.get(id);
    }
    
    /**
     * Create a new user
     */
    @PostMapping
    public ResponseEntity<UserDto> create(@RequestBody UserPayload payload) {
        UserDto created = userService.create(payload);
        return ResponseEntity.status(201).body(created);
    }
    
    /**
     * Update an existing user
     */
    @PutMapping("/{id}")
    public UserDto update(@PathVariable String id, @RequestBody UserPayload payload) {
        return userService.update(id, payload);
    }
    
    /**
     * Delete a user
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Bulk delete users
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody Map<String, List<String>> request) {
        List<String> ids = request.getOrDefault("ids", List.of());
        userService.deleteBulk(ids);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Toggle user active status
     */
    @PutMapping("/{id}/status")
    public UserDto toggleStatus(@PathVariable String id) {
        return userService.toggleStatus(id);
    }
    
    /**
     * Search users
     */
    @GetMapping("/search")
    public List<UserDto> search(@RequestParam String q) {
        return userService.search(q);
    }
    
    /**
     * Export users to CSV
     */
    @GetMapping("/export/csv")
    public ResponseEntity<ByteArrayResource> exportCsv(@RequestParam Map<String, String> params) {
        List<UserDto> data = userService.list(params.get("q"), 
            params.get("role") != null ? User.Role.valueOf(params.get("role").toUpperCase()) : null,
            params.get("status"));
        String csv = userService.exportCsv(data);
        ByteArrayResource resource = new ByteArrayResource(csv.getBytes(StandardCharsets.UTF_8));
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=users.csv")
            .contentLength(resource.contentLength())
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(resource);
    }
    
    /**
     * Get user statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return userService.getStats();
    }
    
    private static int parseInt(String value, int defaultValue) {
        try {
            return value != null ? Integer.parseInt(value) : defaultValue;
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }
}