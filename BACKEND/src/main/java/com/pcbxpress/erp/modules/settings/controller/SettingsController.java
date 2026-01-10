package com.pcbxpress.erp.modules.settings.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    
    /**
     * Get settings overview
     * @return Map of available settings modules and their status
     */
    @GetMapping
    public Map<String, Object> getSettingsOverview() {
        Map<String, Object> overview = new HashMap<>();
        overview.put("modules", getAvailableModules());
        overview.put("status", "active");
        overview.put("version", "1.0.0");
        return overview;
    }
    
    /**
     * Get available settings modules
     * @return Map of available modules
     */
    private Map<String, Object> getAvailableModules() {
        Map<String, Object> modules = new HashMap<>();
        
        Map<String, String> company = new HashMap<>();
        company.put("name", "Company Settings");
        company.put("description", "Manage company profile, working hours, and branding");
        company.put("endpoint", "/api/settings/company");
        company.put("status", "available");
        modules.put("company", company);
        
        Map<String, String> integrations = new HashMap<>();
        integrations.put("name", "Integrations");
        integrations.put("description", "Manage accounting, email, barcode, and webhook integrations");
        integrations.put("endpoint", "/api/settings/integrations");
        integrations.put("status", "available");
        modules.put("integrations", integrations);
        
        Map<String, String> numbering = new HashMap<>();
        numbering.put("name", "Numbering Series");
        numbering.put("description", "Manage document numbering and sequence generation");
        numbering.put("endpoint", "/api/settings/numbering");
        numbering.put("status", "available");
        modules.put("numbering", numbering);
        
        Map<String, String> plants = new HashMap<>();
        plants.put("name", "Plants");
        plants.put("description", "Manage manufacturing plants and facilities");
        plants.put("endpoint", "/api/settings/plants");
        plants.put("status", "available");
        modules.put("plants", plants);
        
        return modules;
    }
    
    /**
     * Health check for settings module
     * @return Health status
     */
    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        Map<String, String> health = new HashMap<>();
        health.put("status", "healthy");
        health.put("module", "settings");
        health.put("timestamp", java.time.LocalDateTime.now().toString());
        return health;
    }
}