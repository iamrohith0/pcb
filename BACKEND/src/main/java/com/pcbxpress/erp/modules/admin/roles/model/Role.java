package com.pcbxpress.erp.modules.admin.roles.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Role Entity for Admin Module
 * Represents a role with permissions in the PCBXpress ERP system
 */
@Entity
@Table(name = "admin_roles", indexes = {
    @Index(name = "idx_roles_key", columnList = "role_key"),
    @Index(name = "idx_roles_name", columnList = "name"),
    @Index(name = "idx_roles_status", columnList = "status"),
    @Index(name = "idx_roles_created_at", columnList = "created_at"),
    @Index(name = "idx_roles_updated_at", columnList = "updated_at")
})
public class Role {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "role_key", nullable = false, unique = true, length = 50)
    private String roleKey;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(columnDefinition = "text")
    private String description;
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive;
    
    @Column(name = "role_type", length = 50)
    @Enumerated(EnumType.STRING)
    private RoleType roleType;
    
    @Column(name = "department", length = 100)
    private String department;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        
        // Set default values
        if (isActive == false) {
            isActive = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
    
    // Getters and Setters
    
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getRoleKey() {
        return roleKey;
    }
    
    public void setRoleKey(String roleKey) {
        this.roleKey = roleKey;
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
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    public RoleType getRoleType() {
        return roleType;
    }
    
    public void setRoleType(RoleType roleType) {
        this.roleType = roleType;
    }
    
    public String getDepartment() {
        return department;
    }
    
    public void setDepartment(String department) {
        this.department = department;
    }
    
    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public String getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public enum RoleType {
        SYSTEM,
        CUSTOM,
        DEPARTMENTAL,
        PROJECT
    }
}