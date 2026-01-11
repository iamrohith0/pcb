package com.pcbxpress.erp.modules.admin.users.repository;

import com.pcbxpress.erp.modules.admin.users.model.User;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Admin Users
 */
@Repository
public interface AdminUserRepository extends JpaRepository<User, UUID> {
    
    /**
     * Find user by username (case insensitive)
     */
    User findByUsernameIgnoreCase(String username);
    
    /**
     * Find user by email (case insensitive)
     */
    User findByEmailIgnoreCase(String email);
    
    /**
     * Find user by employee code
     */
    User findByEmployeeCode(String employeeCode);
    
    /**
     * Check if username exists (excluding current user)
     */
    boolean existsByUsernameIgnoreCaseAndIdNot(String username, UUID id);
    
    /**
     * Check if email exists (excluding current user)
     */
    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);
    
    /**
     * Check if employee code exists (excluding current user)
     */
    boolean existsByEmployeeCodeAndIdNot(String employeeCode, UUID id);
    
    /**
     * Find users by role
     */
    List<User> findByRole(User.Role role);
    
    /**
     * Find active users
     */
    List<User> findByIsActiveTrue();
    
    /**
     * Find inactive users
     */
    List<User> findByIsActiveFalse();
    
    /**
     * Find users by department
     */
    List<User> findByDepartmentIgnoreCase(String department);
    
    /**
     * Find users by name containing text (case insensitive)
     */
    List<User> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find users by username containing text (case insensitive)
     */
    List<User> findByUsernameContainingIgnoreCase(String username);
    
    /**
     * Find users by email containing text (case insensitive)
     */
    List<User> findByEmailContainingIgnoreCase(String email);
    
    /**
     * Find users by employee code containing text
     */
    List<User> findByEmployeeCodeContaining(String employeeCode);
    
    /**
     * Find users by role and active status
     */
    List<User> findByRoleAndIsActiveTrue(User.Role role);
    
    /**
     * Find users by department and active status
     */
    List<User> findByDepartmentIgnoreCaseAndIsActiveTrue(String department);
    
    /**
     * Find users by multiple criteria
     */
    @Query("SELECT u FROM AdminUser u WHERE " +
           "(:role IS NULL OR u.role = :role) " +
           "AND (:status IS NULL OR " +
           "(:status = 'active' AND u.isActive = true) OR " +
           "(:status = 'inactive' AND u.isActive = false)) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(u.employeeCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(u.department) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<User> findByCriteria(@Param("role") User.Role role,
                             @Param("status") String status,
                             @Param("searchText") String searchText);

    /**
     * Find users with recent login activity
     */
    @Query("SELECT u FROM AdminUser u WHERE u.lastLoginAt IS NOT NULL " +
           "AND u.lastLoginAt > :since")
    List<User> findUsersWithRecentLogin(@Param("since") java.time.OffsetDateTime since);
    
    /**
     * Count active users
     */
    long countByIsActiveTrue();
    
    /**
     * Count users by role
     */
    long countByRole(User.Role role);
    
    /**
     * Count users by role and active status
     */
    long countByRoleAndIsActiveTrue(User.Role role);
}