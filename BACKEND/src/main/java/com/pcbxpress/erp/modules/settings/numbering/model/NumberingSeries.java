package com.pcbxpress.erp.modules.settings.numbering.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "numbering_series")
public class NumberingSeries {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(name = "series_name", nullable = false)
    private String seriesName;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "prefix")
    private String prefix;
    
    @Column(name = "suffix")
    private String suffix;
    
    @Column(name = "start_number", nullable = false)
    private Integer startNumber = 1;
    
    @Column(name = "current_number", nullable = false)
    private Integer currentNumber = 1;
    
    @Column(name = "increment_by", nullable = false)
    private Integer incrementBy = 1;
    
    @Column(name = "reset_frequency")
    @Enumerated(EnumType.STRING)
    private ResetFrequency resetFrequency;
    
    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;
    
    @Column(name = "format_pattern")
    private String formatPattern;
    
    @Column(name = "length", nullable = false)
    private Integer length = 5;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public NumberingSeries() {}
    
    public NumberingSeries(String seriesName) {
        this.seriesName = seriesName;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Enums
    public enum ResetFrequency {
        NEVER,
        DAILY,
        MONTHLY,
        YEARLY
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
    
    public ResetFrequency getResetFrequency() {
        return resetFrequency;
    }
    
    public void setResetFrequency(ResetFrequency resetFrequency) {
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
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Generate next number in sequence
     * @return the next number in the sequence
     */
    public String generateNextNumber() {
        String number = String.format("%0" + length + "d", currentNumber);
        String result = (prefix != null ? prefix : "") + number + (suffix != null ? suffix : "");
        
        // Increment current number
        currentNumber += incrementBy;
        
        return result;
    }
    
    /**
     * Reset current number based on frequency
     */
    public void resetCurrentNumber() {
        if (resetFrequency != null && resetFrequency != ResetFrequency.NEVER) {
            currentNumber = startNumber;
        }
    }
}