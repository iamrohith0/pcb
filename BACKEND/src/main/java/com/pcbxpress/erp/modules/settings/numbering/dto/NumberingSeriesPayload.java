package com.pcbxpress.erp.modules.settings.numbering.dto;

import com.pcbxpress.erp.modules.settings.numbering.model.NumberingSeries;

public class NumberingSeriesPayload {
    
    private String seriesName;
    private String description;
    private String prefix;
    private String suffix;
    private Integer startNumber;
    private Integer incrementBy;
    private NumberingSeries.ResetFrequency resetFrequency;
    private Boolean enabled;
    private String formatPattern;
    private Integer length;
    
    // Constructors
    public NumberingSeriesPayload() {}
    
    // Getters and Setters
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
}