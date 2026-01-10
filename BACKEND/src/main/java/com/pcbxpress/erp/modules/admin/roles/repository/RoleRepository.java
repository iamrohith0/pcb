package com.pcbxpress.erp.modules.admin.roles.repository;

import com.pcbxpress.erp.modules.admin.roles.model.Role;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Admin Roles
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    
    /**
     * Find role by role key (case insensitive)
     */
    Role findByRoleKeyIgnoreCase(String roleKey);
    
    /**
     * Find role by name (case insensitive)
     */
    Role findByNameIgnoreCase(String name);
    
    /**
     * Check if role key exists (excluding current role)
     */
    boolean existsByRoleKeyIgnoreCaseAndIdNot(String roleKey, UUID id);
    
    /**
     * Check if name exists (excluding current role)
     */
    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
    
    /**
     * Find active roles
     */
    List<Role> findByIsActiveTrue();
    
    /**
     * Find inactive roles
     */
    List<Role> findByIsActiveFalse();
    
    /**
     * Find roles by role type
     */
    List<Role> findByRoleType(Role.RoleType roleType);
    
    /**
     * Find roles by department
     */
    List<Role> findByDepartmentIgnoreCase(String department);
    
    /**
     * Find roles by name containing text (case insensitive)
     */
    List<Role> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find roles by description containing text (case insensitive)
     */
    List<Role> findByDescriptionContainingIgnoreCase(String description);
    
    /**
     * Find roles by role type and active status
     */
    List<Role> findByRoleTypeAndIsActiveTrue(Role.RoleType roleType);
    
    /**
     * Find roles by department and active status
     */
    List<Role> findByDepartmentIgnoreCaseAndIsActiveTrue(String department);
    
    /**
     * Find roles by multiple criteria
     */
    @Query("SELECT r FROM Role r WHERE " +
           "(:roleType IS NULL OR r.roleType = :roleType) " +
           "AND (:status IS NULL OR " +
           "(:status = 'active' AND r.isActive = true) OR " +
           "(:status = 'inactive' AND r.isActive = false)) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.roleKey) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(r.department) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<Role> findByCriteria(@Param("roleType") Role.RoleType roleType,
                            @Param("status") String status,
                            @Param("searchText") String searchText);
    
    /**
     * Count active roles
     */
    long countByIsActiveTrue();
    
    /**
     * Count roles by role type
     */
    long countByRoleType(Role.RoleType roleType);
    
    /**
     * Count roles by role type and active status
     */
    long countByRoleTypeAndIsActiveTrue(Role.RoleType roleType);
    
    /**
     * Find roles created by a specific user
     */
    List<Role> findByCreatedBy(String createdBy);
    
    /**
     * Find roles updated by a specific user
     */
    List<Role> findByUpdatedBy(String updatedBy);
}