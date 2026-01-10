package com.pcbxpress.erp.modules.settings.integrations.controller;

import com.pcbxpress.erp.modules.settings.integrations.dto.IntegrationDto;
import com.pcbxpress.erp.modules.settings.integrations.dto.IntegrationPayload;
import com.pcbxpress.erp.modules.settings.integrations.model.Integration;
import com.pcbxpress.erp.modules.settings.integrations.service.IntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/settings/integrations")
public class IntegrationController {
    
    private final IntegrationService integrationService;
    
    @Autowired
    public IntegrationController(IntegrationService integrationService) {
        this.integrationService = integrationService;
    }
    
    /**
     * Get all integrations
     * @return List of all integration DTOs
     */
    @GetMapping
    public ResponseEntity<List<IntegrationDto>> getAllIntegrations() {
        List<IntegrationDto> integrations = integrationService.getAllIntegrations();
        return ResponseEntity.ok(integrations);
    }
    
    /**
     * Get integrations by type
     * @param type the integration type
     * @return List of integration DTOs of the specified type
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<IntegrationDto>> getIntegrationsByType(@PathVariable Integration.IntegrationType type) {
        List<IntegrationDto> integrations = integrationService.getIntegrationsByType(type);
        return ResponseEntity.ok(integrations);
    }
    
    /**
     * Get enabled integrations by type
     * @param type the integration type
     * @return List of enabled integration DTOs of the specified type
     */
    @GetMapping("/type/{type}/enabled")
    public ResponseEntity<List<IntegrationDto>> getEnabledIntegrationsByType(@PathVariable Integration.IntegrationType type) {
        List<IntegrationDto> integrations = integrationService.getEnabledIntegrationsByType(type);
        return ResponseEntity.ok(integrations);
    }
    
    /**
     * Get integration by ID
     * @param id the integration ID
     * @return Integration DTO
     */
    @GetMapping("/{id}")
    public ResponseEntity<IntegrationDto> getIntegrationById(@PathVariable UUID id) {
        return integrationService.getIntegrationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get integration by name
     * @param name the integration name
     * @return Integration DTO
     */
    @GetMapping("/name/{name}")
    public ResponseEntity<IntegrationDto> getIntegrationByName(@PathVariable String name) {
        return integrationService.getIntegrationByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get integrations by enabled status
     * @param enabled the enabled status
     * @return List of integration DTOs with the specified enabled status
     */
    @GetMapping("/enabled/{enabled}")
    public ResponseEntity<List<IntegrationDto>> getIntegrationsByEnabled(@PathVariable Boolean enabled) {
        List<IntegrationDto> integrations = integrationService.getIntegrationsByEnabled(enabled);
        return ResponseEntity.ok(integrations);
    }
    
    /**
     * Create new integration
     * @param payload the integration payload
     * @return Created integration DTO
     */
    @PostMapping
    public ResponseEntity<IntegrationDto> createIntegration(@RequestBody IntegrationPayload payload) {
        IntegrationDto createdIntegration = integrationService.createIntegration(payload);
        return ResponseEntity.ok(createdIntegration);
    }
    
    /**
     * Update integration
     * @param id the integration ID
     * @param payload the integration payload
     * @return Updated integration DTO
     */
    @PutMapping("/{id}")
    public ResponseEntity<IntegrationDto> updateIntegration(@PathVariable UUID id, @RequestBody IntegrationPayload payload) {
        IntegrationDto updatedIntegration = integrationService.updateIntegration(id, payload);
        return ResponseEntity.ok(updatedIntegration);
    }
    
    /**
     * Delete integration
     * @param id the integration ID
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIntegration(@PathVariable UUID id) {
        integrationService.deleteIntegration(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Enable/disable integration
     * @param id the integration ID
     * @param enabled the enabled status
     * @return No content response
     */
    @PutMapping("/{id}/enabled/{enabled}")
    public ResponseEntity<Void> setIntegrationEnabled(@PathVariable UUID id, @PathVariable Boolean enabled) {
        integrationService.setIntegrationEnabled(id, enabled);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Update integration sync status
     * @param id the integration ID
     * @param status the sync status
     * @return No content response
     */
    @PutMapping("/{id}/sync/{status}")
    public ResponseEntity<Void> updateSyncStatus(@PathVariable UUID id, @PathVariable Integration.SyncStatus status) {
        integrationService.updateSyncStatus(id, status);
        return ResponseEntity.noContent().build();
    }
}