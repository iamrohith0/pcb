package com.pcbxpress.erp.modules.settings.numbering.dto;

import com.pcbxpress.erp.modules.settings.numbering.model.NumberingSeries;
import java.time.LocalDateTime;
import java.util.UUID;

public class NumberingSeriesDto {
    
    private UUID id;
    private String seriesName;
    private String description;
    private String prefix;
    private String suffix;
    private Integer startNumber;
    private Integer currentNumber;
    private Integer incrementBy;
    private NumberingSeries.ResetFrequency resetFrequency;
    private Boolean enabled;
    private String formatPattern;
    private Integer length;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public NumberingSeriesDto() {}
    
    public NumberingSeriesDto(UUID id, String seriesName, String description, String prefix,
                             String suffix, Integer startNumber, Integer currentNumber,
                             Integer incrementBy, NumberingSeries.ResetFrequency resetFrequency,
                             Boolean enabled, String formatPattern, Integer length,
                             LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.seriesName = seriesName;
        this.description = description;
        this.prefix = prefix;
        this.suffix = suffix;
        this.startNumber = startNumber;
        this.currentNumber = currentNumber;
        this.incrementBy = incrementBy;
        this.resetFrequency = resetFrequency;
        this.enabled = enabled;
        this.formatPattern = formatPattern;
        this.length = length;
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
    
    public String getSeriesName() {
        return seriesName;
    }
    
    public void setSeriesName(String seriesName) {
        this.seriesName = seriesName;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getPrefix() {
        return prefix;
    }
    
    public void setPrefix(String prefix) {
        this.prefix = prefix;
    }
    
    public String getSuffix() {
        return suffix;
    }
    
    public void setSuffix(String suffix) {
        this.suffix = suffix;
    }
    
    public Integer getStartNumber() {
        return startNumber;
    }
    
    public void setStartNumber(Integer startNumber) {
        this.startNumber = startNumber;
    }
    
    public Integer getCurrentNumber() {
        return currentNumber;
    }
    
    public void setCurrentNumber(Integer currentNumber) {
        this.currentNumber = currentNumber;
    }
    
    public Integer getIncrementBy() {
        return incrementBy;
    }
    
    public void setIncrementBy(Integer incrementBy) {
        this.incrementBy = incrementBy;
    }
    
    public NumberingSeries.ResetFrequency getResetFrequency() {
        return resetFrequency;
    }
    
    public void setResetFrequency(NumberingSeries.ResetFrequency resetFrequency) {
        this.resetFrequency = resetFrequency;
    }
    
    public Boolean getEnabled() {
        return enabled;
    }
    
    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }
    
    public String getFormatPattern() {
        return formatPattern;
    }
    
    public void setFormatPattern(String formatPattern) {
        this.formatPattern = formatPattern;
    }
    
    public Integer getLength() {
        return length;
    }
    
    public void setLength(Integer length) {
        this.length = length;
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