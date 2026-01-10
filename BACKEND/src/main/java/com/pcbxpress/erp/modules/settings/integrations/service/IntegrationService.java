package com.pcbxpress.erp.modules.settings.integrations.service;

import com.pcbxpress.erp.modules.settings.integrations.dto.IntegrationDto;
import com.pcbxpress.erp.modules.settings.integrations.dto.IntegrationPayload;
import com.pcbxpress.erp.modules.settings.integrations.model.Integration;
import com.pcbxpress.erp.modules.settings.integrations.repository.IntegrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IntegrationService {
    
    private final IntegrationRepository integrationRepository;
    
    @Autowired
    public IntegrationService(IntegrationRepository integrationRepository) {
        this.integrationRepository = integrationRepository;
    }
    
    /**
     * Get all integrations
     * @return List of all integration DTOs
     */
    @Transactional(readOnly = true)
    public List<IntegrationDto> getAllIntegrations() {
        return integrationRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get integrations by type
     * @param integrationType the integration type
     * @return List of integration DTOs of the specified type
     */
    @Transactional(readOnly = true)
    public List<IntegrationDto> getIntegrationsByType(Integration.IntegrationType integrationType) {
        return integrationRepository.findByIntegrationType(integrationType).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get enabled integrations by type
     * @param integrationType the integration type
     * @return List of enabled integration DTOs of the specified type
     */
    @Transactional(readOnly = true)
    public List<IntegrationDto> getEnabledIntegrationsByType(Integration.IntegrationType integrationType) {
        return integrationRepository.findByIntegrationTypeAndEnabledTrue(integrationType).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Get integration by ID
     * @param id the integration ID
     * @return Optional of integration DTO
     */
    @Transactional(readOnly = true)
    public Optional<IntegrationDto> getIntegrationById(UUID id) {
        return integrationRepository.findById(id)
                .map(this::convertToDto);
    }
    
    /**
     * Get integration by name
     * @param name the integration name
     * @return Optional of integration DTO
     */
    @Transactional(readOnly = true)
    public Optional<IntegrationDto> getIntegrationByName(String name) {
        return integrationRepository.findByName(name)
                .map(this::convertToDto);
    }
    
    /**
     * Get integrations by enabled status
     * @param enabled the enabled status
     * @return List of integration DTOs with the specified enabled status
     */
    @Transactional(readOnly = true)
    public List<IntegrationDto> getIntegrationsByEnabled(Boolean enabled) {
        return integrationRepository.findByEnabled(enabled).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Create new integration
     * @param payload the integration payload
     * @return Created integration DTO
     */
    @Transactional
    public IntegrationDto createIntegration(IntegrationPayload payload) {
        validateIntegrationPayload(payload, null);
        
        Integration integration = new Integration(payload.getIntegrationType(), payload.getName());
        updateIntegrationFromPayload(integration, payload);
        
        Integration savedIntegration = integrationRepository.save(integration);
        return convertToDto(savedIntegration);
    }
    
    /**
     * Update integration
     * @param id the integration ID
     * @param payload the integration payload
     * @return Updated integration DTO
     */
    @Transactional
    public IntegrationDto updateIntegration(UUID id, IntegrationPayload payload) {
        Integration existingIntegration = integrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Integration not found with id: " + id));
        
        validateIntegrationPayload(payload, id);
        updateIntegrationFromPayload(existingIntegration, payload);
        
        Integration updatedIntegration = integrationRepository.save(existingIntegration);
        return convertToDto(updatedIntegration);
    }
    
    /**
     * Delete integration
     * @param id the integration ID
     */
    @Transactional
    public void deleteIntegration(UUID id) {
        if (!integrationRepository.existsById(id)) {
            throw new RuntimeException("Integration not found with id: " + id);
        }
        integrationRepository.deleteById(id);
    }
    
    /**
     * Enable/disable integration
     * @param id the integration ID
     * @param enabled the enabled status
     */
    @Transactional
    public void setIntegrationEnabled(UUID id, Boolean enabled) {
        Integration integration = integrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Integration not found with id: " + id));
        integration.setEnabled(enabled);
        integrationRepository.save(integration);
    }
    
    /**
     * Update integration sync status
     * @param id the integration ID
     * @param status the sync status
     */
    @Transactional
    public void updateSyncStatus(UUID id, Integration.SyncStatus status) {
        Integration integration = integrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Integration not found with id: " + id));
        integration.setLastSyncAt(LocalDateTime.now());
        integration.setLastSyncStatus(status);
        integrationRepository.save(integration);
    }
    
    /**
     * Validate integration payload
     * @param payload the integration payload
     * @param excludeId the integration ID to exclude from validation
     */
    private void validateIntegrationPayload(IntegrationPayload payload, UUID excludeId) {
        if (payload.getName() != null && 
            integrationRepository.existsByNameAndIdNot(payload.getName(), excludeId)) {
            throw new RuntimeException("Integration name already exists");
        }
    }
    
    /**
     * Update integration entity from payload
     * @param integration the integration entity
     * @param payload the integration payload
     */
    private void updateIntegrationFromPayload(Integration integration, IntegrationPayload payload) {
        if (payload.getIntegrationType() != null) {
            integration.setIntegrationType(payload.getIntegrationType());
        }
        if (payload.getName() != null) {
            integration.setName(payload.getName());
        }
        if (payload.getDescription() != null) {
            integration.setDescription(payload.getDescription());
        }
        if (payload.getEnabled() != null) {
            integration.setEnabled(payload.getEnabled());
        }
        if (payload.getConfig() != null) {
            integration.setConfig(payload.getConfig());
        }
        if (payload.getApiKey() != null) {
            integration.setApiKey(payload.getApiKey());
        }
        if (payload.getApiSecret() != null) {
            integration.setApiSecret(payload.getApiSecret());
        }
        if (payload.getBaseUrl() != null) {
            integration.setBaseUrl(payload.getBaseUrl());
        }
        if (payload.getWebhookUrl() != null) {
            integration.setWebhookUrl(payload.getWebhookUrl());
        }
        if (payload.getWebhookSecret() != null) {
            integration.setWebhookSecret(payload.getWebhookSecret());
        }
    }
    
    /**
     * Convert integration entity to DTO
     * @param integration the integration entity
     * @return Integration DTO
     */
    private IntegrationDto convertToDto(Integration integration) {
        return new IntegrationDto(
            integration.getId(),
            integration.getIntegrationType(),
            integration.getName(),
            integration.getDescription(),
            integration.getEnabled(),
            integration.getConfig(),
            integration.getApiKey(),
            integration.getApiSecret(),
            integration.getBaseUrl(),
            integration.getWebhookUrl(),
            integration.getWebhookSecret(),
            integration.getLastSyncAt(),
            integration.getLastSyncStatus(),
            integration.getCreatedAt(),
            integration.getUpdatedAt()
        );
    }
}