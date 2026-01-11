package com.pcbxpress.erp.modules.quality.aoi.dto;

import com.pcbxpress.erp.modules.quality.aoi.model.AOIDefect;
import java.time.LocalDateTime;

public class AOIDefectDto {
    
    private Long id;
    private String code;
    private String name;
    private String category;
    private String severity;
    private String side;
    private Boolean isActive;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public AOIDefectDto() {}
    
    public AOIDefectDto(AOIDefect defect) {
        this.id = defect.getId();
        this.code = defect.getCode();
        this.name = defect.getName();
        this.category = defect.getCategory();
        this.severity = defect.getSeverity() != null ? defect.getSeverity().name() : null;
        this.side = defect.getSide() != null ? defect.getSide().name() : null;
        this.isActive = defect.getIsActive();
        this.description = defect.getDescription();
        this.createdAt = defect.getCreatedAt();
        this.updatedAt = defect.getUpdatedAt();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getSeverity() {
        return severity;
    }
    
    public void setSeverity(String severity) {
        this.severity = severity;
    }
    
    public String getSide() {
        return side;
    }
    
    public void setSide(String side) {
        this.side = side;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
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