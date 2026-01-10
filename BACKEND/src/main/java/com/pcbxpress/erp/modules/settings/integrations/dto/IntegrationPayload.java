package com.pcbxpress.erp.modules.settings.integrations.dto;

import com.pcbxpress.erp.modules.settings.integrations.model.Integration;

public class IntegrationPayload {
    
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
    
    // Constructors
    public IntegrationPayload() {}
    
    // Getters and Setters
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
}