package com.pcbxpress.erp.modules.admin.permissions.repository;

import com.pcbxpress.erp.modules.admin.permissions.model.Permission;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Permissions
 */
@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    
    /**
     * Find permission by code (case insensitive)
     */
    Permission findByCodeIgnoreCase(String code);
    
    /**
     * Check if permission code exists (excluding current permission)
     */
    boolean existsByCodeIgnoreCaseAndIdNot(String code, UUID id);
    
    /**
     * Find permissions by module
     */
    List<Permission> findByModuleIgnoreCase(String module);
    
    /**
     * Find permissions by module and active status
     */
    List<Permission> findByModuleIgnoreCaseAndIsActiveTrue(String module);
    
    /**
     * Find permissions by permission type
     */
    List<Permission> findByPermissionType(Permission.PermissionType permissionType);
    
    /**
     * Find permissions by system status
     */
    List<Permission> findByIsSystem(boolean isSystem);
    
    /**
     * Find active permissions
     */
    List<Permission> findByIsActiveTrue();
    
    /**
     * Find system permissions
     */
    List<Permission> findByIsSystemTrue();
    
    /**
     * Find custom permissions
     */
    List<Permission> findByIsSystemFalse();
    
    /**
     * Find permissions by name containing text (case insensitive)
     */
    List<Permission> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find permissions by description containing text (case insensitive)
     */
    List<Permission> findByDescriptionContainingIgnoreCase(String description);
    
    /**
     * Find permissions by module and permission type
     */
    List<Permission> findByModuleIgnoreCaseAndPermissionType(String module, Permission.PermissionType permissionType);
    
    /**
     * Find permissions by module and permission type and active status
     */
    List<Permission> findByModuleIgnoreCaseAndPermissionTypeAndIsActiveTrue(String module, Permission.PermissionType permissionType);
    
    /**
     * Find permissions by multiple criteria
     */
    @Query("SELECT p FROM Permission p WHERE " +
           "(:module IS NULL OR LOWER(p.module) = LOWER(:module)) " +
           "AND (:permissionType IS NULL OR p.permissionType = :permissionType) " +
           "AND (:isSystem IS NULL OR p.isSystem = :isSystem) " +
           "AND (:isActive IS NULL OR p.isActive = :isActive) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.code) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(p.operation) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<Permission> findByCriteria(@Param("module") String module,
                                  @Param("permissionType") Permission.PermissionType permissionType,
                                  @Param("isSystem") Boolean isSystem,
                                  @Param("isActive") Boolean isActive,
                                  @Param("searchText") String searchText);
    
    /**
     * Find permissions by module with pagination support
     */
    @Query("SELECT p FROM Permission p WHERE LOWER(p.module) = LOWER(:module) ORDER BY p.displayOrder, p.name")
    List<Permission> findByModuleIgnoreCaseOrderByDisplayOrder(@Param("module") String module);
    
    /**
     * Find permissions by module and active status with pagination support
     */
    @Query("SELECT p FROM Permission p WHERE LOWER(p.module) = LOWER(:module) AND p.isActive = true ORDER BY p.displayOrder, p.name")
    List<Permission> findByModuleIgnoreCaseAndIsActiveTrueOrderByDisplayOrder(@Param("module") String module);
    
    /**
     * Get all unique modules
     */
    @Query("SELECT DISTINCT p.module FROM Permission p WHERE p.module IS NOT NULL ORDER BY p.module")
    List<String> findAllModules();
    
    /**
     * Get all unique operations
     */
    @Query("SELECT DISTINCT p.operation FROM Permission p WHERE p.operation IS NOT NULL ORDER BY p.operation")
    List<String> findAllOperations();
    
    /**
     * Count permissions by module
     */
    long countByModule(String module);
    
    /**
     * Count active permissions by module
     */
    long countByModuleAndIsActiveTrue(String module);
    
    /**
     * Count system permissions
     */
    long countByIsSystemTrue();
    
    /**
     * Count custom permissions
     */
    long countByIsSystemFalse();
    
    /**
     * Find permissions by created by user
     */
    List<Permission> findByCreatedBy(String createdBy);
    
    /**
     * Find permissions by updated by user
     */
    List<Permission> findByUpdatedBy(String updatedBy);
    
    /**
     * Find permissions created after a specific date
     */
    List<Permission> findByCreatedAtAfter(java.time.OffsetDateTime date);
    
    /**
     * Find permissions updated after a specific date
     */
    List<Permission> findByUpdatedAtAfter(java.time.OffsetDateTime date);
}