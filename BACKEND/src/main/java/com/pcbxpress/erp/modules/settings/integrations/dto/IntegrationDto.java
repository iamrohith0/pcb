package com.pcbxpress.erp.modules.settings.integrations.dto;

import com.pcbxpress.erp.modules.settings.integrations.model.Integration;
import java.time.LocalDateTime;
import java.util.UUID;

public class IntegrationDto {
    
    private UUID id;
    private Integration.IntegrationType integrationType;
    private String name;
    private String description;
    private Boolean enabled;
    private String config;
    private String apiKey;
    private String apiSecret;
    private String baseUrl;
    private String webhookUrl;
    private String webhookSecret;
    private LocalDateTime lastSyncAt;
    private Integration.SyncStatus lastSyncStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public IntegrationDto() {}
    
    public IntegrationDto(UUID id, Integration.IntegrationType integrationType, String name,
                         String description, Boolean enabled, String config, String apiKey,
                         String apiSecret, String baseUrl, String webhookUrl, String webhookSecret,
                         LocalDateTime lastSyncAt, Integration.SyncStatus lastSyncStatus,
                         LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.integrationType = integrationType;
        this.name = name;
        this.description = description;
        this.enabled = enabled;
        this.config = config;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.baseUrl = baseUrl;
        this.webhookUrl = webhookUrl;
        this.webhookSecret = webhookSecret;
        this.lastSyncAt = lastSyncAt;
        this.lastSyncStatus = lastSyncStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public Integration.IntegrationType getIntegrationType() {
        return integrationType;
    }
    
    public void setIntegrationType(Integration.IntegrationType integrationType) {
        this.integrationType = integrationType;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Boolean getEnabled() {
        return enabled;
    }
    
    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
    
    public String getConfig() {
        return config;
    }
    
    public void setConfig(String config) {
        this.config = config;
    }
    
    public String getApiKey() {
        return apiKey;
    }
    
    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }
    
    public String getApiSecret() {
        return apiSecret;
    }
    
    public void setApiSecret(String apiSecret) {
        this.apiSecret = apiSecret;
    }
    
    public String getBaseUrl() {
        return baseUrl;
    }
    
    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }
    
    public String getWebhookUrl() {
        return webhookUrl;
    }
    
    public void setWebhookUrl(String webhookUrl) {
        this.webhookUrl = webhookUrl;
    }
    
    public String getWebhookSecret() {
        return webhookSecret;
    }
    
    public void setWebhookSecret(String webhookSecret) {
        this.webhookSecret = webhookSecret;
    }
    
    public LocalDateTime getLastSyncAt() {
        return lastSyncAt;
    }
    
    public void setLastSyncAt(LocalDateTime lastSyncAt) {
        this.lastSyncAt = lastSyncAt;
    }
    
    public Integration.SyncStatus getLastSyncStatus() {
        return lastSyncStatus;
    }
    
    public void setLastSyncStatus(Integration.SyncStatus lastSyncStatus) {
        this.lastSyncStatus = lastSyncStatus;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}