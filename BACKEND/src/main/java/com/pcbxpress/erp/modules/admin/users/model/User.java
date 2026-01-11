package com.pcbxpress.erp.modules.admin.users.model;

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
 * User Entity for Admin Module
 * Represents a user in the PCBXpress ERP system
 */
@Entity(name = "AdminUser")
@Table(name = "admin_users", indexes = {
    @Index(name = "idx_users_email", columnList = "email"),
    @Index(name = "idx_users_username", columnList = "username"),
    @Index(name = "idx_users_employee_code", columnList = "employee_code"),
    @Index(name = "idx_users_role", columnList = "role"),
    @Index(name = "idx_users_status", columnList = "status"),
    @Index(name = "idx_users_created_at", columnList = "created_at"),
    @Index(name = "idx_users_updated_at", columnList = "updated_at")
})
public class User {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(nullable = false, length = 100)
    private String username;
    
    @Column(nullable = false, length = 200)
    private String name;
    
    @Column(nullable = false, unique = true, length = 200)
    private String email;
    
    @Column(name = "employee_code", length = 50)
    private String employeeCode;
    
    @Column(name = "role", length = 50)
    @Enumerated(EnumType.STRING)
    private Role role;
    
    @Column(name = "department", length = 100)
    private String department;
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive;
    
    @Column(name = "phone", length = 20)
    private String phone;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;
    
    @Column(name = "password_hash", length = 255)
    private String passwordHash;
    
    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts;
    
    @Column(name = "locked_until")
    private OffsetDateTime lockedUntil;
    
    @Column(name = "password_reset_token", length = 255)
    private String passwordResetToken;
    
    @Column(name = "password_reset_expires_at")
    private OffsetDateTime passwordResetExpiresAt;
    
    @Column(name = "two_factor_enabled", nullable = false)
    private boolean twoFactorEnabled;
    
    @Column(name = "two_factor_secret", length = 100)
    private String twoFactorSecret;
    
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
        if (failedLoginAttempts == null) {
            failedLoginAttempts = 0;
        }
        if (isActive == false) {
            isActive = true;
        }
        if (twoFactorEnabled == false) {
            twoFactorEnabled = false;
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
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getEmployeeCode() {
        return employeeCode;
    }
    
    public void setEmployeeCode(String employeeCode) {
        this.employeeCode = employeeCode;
    }
    
    public Role getRole() {
        return role;
    }
    
    public void setRole(Role role) {
        this.role = role;
    }
    
    public String getDepartment() {
        return department;
    }
    
    public void setDepartment(String department) {
        this.department = department;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
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
    
    public OffsetDateTime getLastLoginAt() {
        return lastLoginAt;
    }
    
    public void setLastLoginAt(OffsetDateTime lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }
    
    public String getPasswordHash() {
        return passwordHash;
    }
    
    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }
    
    public Integer getFailedLoginAttempts() {
        return failedLoginAttempts;
    }
    
    public void setFailedLoginAttempts(Integer failedLoginAttempts) {
        this.failedLoginAttempts = failedLoginAttempts;
    }
    
    public OffsetDateTime getLockedUntil() {
        return lockedUntil;
    }
    
    public void setLockedUntil(OffsetDateTime lockedUntil) {
        this.lockedUntil = lockedUntil;
    }
    
    public String getPasswordResetToken() {
        return passwordResetToken;
    }
    
    public void setPasswordResetToken(String passwordResetToken) {
        this.passwordResetToken = passwordResetToken;
    }
    
    public OffsetDateTime getPasswordResetExpiresAt() {
        return passwordResetExpiresAt;
    }
    
    public void setPasswordResetExpiresAt(OffsetDateTime passwordResetExpiresAt) {
        this.passwordResetExpiresAt = passwordResetExpiresAt;
    }
    
    public boolean isTwoFactorEnabled() {
        return twoFactorEnabled;
    }
    
    public void setTwoFactorEnabled(boolean twoFactorEnabled) {
        this.twoFactorEnabled = twoFactorEnabled;
    }
    
    public String getTwoFactorSecret() {
        return twoFactorSecret;
    }
    
    public void setTwoFactorSecret(String twoFactorSecret) {
        this.twoFactorSecret = twoFactorSecret;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public enum Role {
        ADMIN,
        SALES_MANAGER,
        SALES_REP,
        ENGINEERING_MANAGER,
        CAM_ENGINEER,
        DFM_ENGINEER,
        PRODUCTION_MANAGER,
        SUPERVISOR,
        OPERATOR,
        QUALITY_MANAGER,
        QA_INSPECTOR,
        INVENTORY_MANAGER,
        STORE_KEEPER,
        PROCUREMENT_MANAGER,
        PURCHASER,
        WAREHOUSE_MANAGER,
        LOGISTICS_COORDINATOR,
        MAINTENANCE_MANAGER,
        MAINTENANCE_TECH,
        TRACABILITY_SPECIALIST,
        VIEWER
    }
}