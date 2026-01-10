package com.pcbxpress.erp.modules.audit.repository;

import com.pcbxpress.erp.modules.audit.model.AuditEvent;
import com.pcbxpress.erp.modules.audit.model.AuditEvent.Operation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for Audit Events
 */
@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {
    
    /**
     * Find audit events by user ID
     */
    Page<AuditEvent> findByUserIdOrderByTimestampDesc(UUID userId, Pageable pageable);
    
    /**
     * Find audit events by username
     */
    Page<AuditEvent> findByUsernameOrderByTimestampDesc(String username, Pageable pageable);
    
    /**
     * Find audit events by module
     */
    Page<AuditEvent> findByModuleOrderByTimestampDesc(String module, Pageable pageable);
    
    /**
     * Find audit events by entity type
     */
    Page<AuditEvent> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);
    
    /**
     * Find audit events by entity ID
     */
    Page<AuditEvent> findByEntityIdOrderByTimestampDesc(String entityId, Pageable pageable);
    
    /**
     * Find audit events by operation
     */
    Page<AuditEvent> findByOperationOrderByTimestampDesc(Operation operation, Pageable pageable);
    
    /**
     * Find audit events by success status
     */
    Page<AuditEvent> findBySuccessOrderByTimestampDesc(boolean success, Pageable pageable);
    
    /**
     * Find audit events by date range
     */
    Page<AuditEvent> findByTimestampBetweenOrderByTimestampDesc(OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by module and operation
     */
    Page<AuditEvent> findByModuleAndOperationOrderByTimestampDesc(String module, Operation operation, Pageable pageable);
    
    /**
     * Find audit events by entity type and operation
     */
    Page<AuditEvent> findByEntityTypeAndOperationOrderByTimestampDesc(String entityType, Operation operation, Pageable pageable);
    
    /**
     * Find audit events by user and module
     */
    Page<AuditEvent> findByUserIdAndModuleOrderByTimestampDesc(UUID userId, String module, Pageable pageable);
    
    /**
     * Find audit events by user and operation
     */
    Page<AuditEvent> findByUserIdAndOperationOrderByTimestampDesc(UUID userId, Operation operation, Pageable pageable);
    
    /**
     * Find audit events by module and date range
     */
    Page<AuditEvent> findByModuleAndTimestampBetweenOrderByTimestampDesc(String module, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by entity type and date range
     */
    Page<AuditEvent> findByEntityTypeAndTimestampBetweenOrderByTimestampDesc(String entityType, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by operation and date range
     */
    Page<AuditEvent> findByOperationAndTimestampBetweenOrderByTimestampDesc(Operation operation, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by username and operation
     */
    Page<AuditEvent> findByUsernameAndOperationOrderByTimestampDesc(String username, Operation operation, Pageable pageable);
    
    /**
     * Find audit events by username and module
     */
    Page<AuditEvent> findByUsernameAndModuleOrderByTimestampDesc(String username, String module, Pageable pageable);
    
    /**
     * Find audit events by username, module, and operation
     */
    Page<AuditEvent> findByUsernameAndModuleAndOperationOrderByTimestampDesc(String username, String module, Operation operation, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, and date range
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndTimestampBetweenOrderByTimestampDesc(
        String entityType, Operation operation, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by module, operation, and date range
     */
    Page<AuditEvent> findByModuleAndOperationAndTimestampBetweenOrderByTimestampDesc(
        String module, Operation operation, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by user, module, operation, and date range
     */
    Page<AuditEvent> findByUserIdAndModuleAndOperationAndTimestampBetweenOrderByTimestampDesc(
        UUID userId, String module, Operation operation, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by username, module, operation, and date range
     */
    Page<AuditEvent> findByUsernameAndModuleAndOperationAndTimestampBetweenOrderByTimestampDesc(
        String username, String module, Operation operation, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by entity type and success status
     */
    Page<AuditEvent> findByEntityTypeAndSuccessOrderByTimestampDesc(String entityType, boolean success, Pageable pageable);
    
    /**
     * Find audit events by operation and success status
     */
    Page<AuditEvent> findByOperationAndSuccessOrderByTimestampDesc(Operation operation, boolean success, Pageable pageable);
    
    /**
     * Find audit events by module and success status
     */
    Page<AuditEvent> findByModuleAndSuccessOrderByTimestampDesc(String module, boolean success, Pageable pageable);
    
    /**
     * Find audit events by username and success status
     */
    Page<AuditEvent> findByUsernameAndSuccessOrderByTimestampDesc(String username, boolean success, Pageable pageable);
    
    /**
     * Find audit events by user and success status
     */
    Page<AuditEvent> findByUserIdAndSuccessOrderByTimestampDesc(UUID userId, boolean success, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, and success status
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndSuccessOrderByTimestampDesc(
        String entityType, Operation operation, boolean success, Pageable pageable);
    
    /**
     * Find audit events by module, operation, and success status
     */
    Page<AuditEvent> findByModuleAndOperationAndSuccessOrderByTimestampDesc(
        String module, Operation operation, boolean success, Pageable pageable);
    
    /**
     * Find audit events by username, operation, and success status
     */
    Page<AuditEvent> findByUsernameAndOperationAndSuccessOrderByTimestampDesc(
        String username, Operation operation, boolean success, Pageable pageable);
    
    /**
     * Find audit events by user, operation, and success status
     */
    Page<AuditEvent> findByUserIdAndOperationAndSuccessOrderByTimestampDesc(
        UUID userId, Operation operation, boolean success, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, success status, and date range
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndSuccessAndTimestampBetweenOrderByTimestampDesc(
        String entityType, Operation operation, boolean success, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by module, operation, success status, and date range
     */
    Page<AuditEvent> findByModuleAndOperationAndSuccessAndTimestampBetweenOrderByTimestampDesc(
        String module, Operation operation, boolean success, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by username, operation, success status, and date range
     */
    Page<AuditEvent> findByUsernameAndOperationAndSuccessAndTimestampBetweenOrderByTimestampDesc(
        String username, Operation operation, boolean success, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by user, operation, success status, and date range
     */
    Page<AuditEvent> findByUserIdAndOperationAndSuccessAndTimestampBetweenOrderByTimestampDesc(
        UUID userId, Operation operation, boolean success, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by entity type and IP address
     */
    Page<AuditEvent> findByEntityTypeAndIpAddressOrderByTimestampDesc(String entityType, String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by operation and IP address
     */
    Page<AuditEvent> findByOperationAndIpAddressOrderByTimestampDesc(Operation operation, String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by module and IP address
     */
    Page<AuditEvent> findByModuleAndIpAddressOrderByTimestampDesc(String module, String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by username and IP address
     */
    Page<AuditEvent> findByUsernameAndIpAddressOrderByTimestampDesc(String username, String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by user and IP address
     */
    Page<AuditEvent> findByUserIdAndIpAddressOrderByTimestampDesc(UUID userId, String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, and IP address
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndIpAddressOrderByTimestampDesc(
        String entityType, Operation operation, String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by module, operation, and IP address
     */
    Page<AuditEvent> findByModuleAndOperationAndIpAddressOrderByTimestampDesc(
        String module, Operation operation, String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by username, operation, and IP address
     */
    Page<AuditEvent> findByUsernameAndOperationAndIpAddressOrderByTimestampDesc(
        String username, Operation operation, String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by user, operation, and IP address
     */
    Page<AuditEvent> findByUserIdAndOperationAndIpAddressOrderByTimestampDesc(
        UUID userId, Operation operation, String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, IP address, and date range
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndIpAddressAndTimestampBetweenOrderByTimestampDesc(
        String entityType, Operation operation, String ipAddress, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by module, operation, IP address, and date range
     */
    Page<AuditEvent> findByModuleAndOperationAndIpAddressAndTimestampBetweenOrderByTimestampDesc(
        String module, Operation operation, String ipAddress, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by username, operation, IP address, and date range
     */
    Page<AuditEvent> findByUsernameAndOperationAndIpAddressAndTimestampBetweenOrderByTimestampDesc(
        String username, Operation operation, String ipAddress, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by user, operation, IP address, and date range
     */
    Page<AuditEvent> findByUserIdAndOperationAndIpAddressAndTimestampBetweenOrderByTimestampDesc(
        UUID userId, Operation operation, String ipAddress, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by entity type and error message (for failed operations)
     */
    Page<AuditEvent> findByEntityTypeAndSuccessFalseAndErrorMessageIsNotNullOrderByTimestampDesc(
        String entityType, Pageable pageable);
    
    /**
     * Find audit events by operation and error message (for failed operations)
     */
    Page<AuditEvent> findByOperationAndSuccessFalseAndErrorMessageIsNotNullOrderByTimestampDesc(
        Operation operation, Pageable pageable);
    
    /**
     * Find audit events by module and error message (for failed operations)
     */
    Page<AuditEvent> findByModuleAndSuccessFalseAndErrorMessageIsNotNullOrderByTimestampDesc(
        String module, Pageable pageable);
    
    /**
     * Find audit events by username and error message (for failed operations)
     */
    Page<AuditEvent> findByUsernameAndSuccessFalseAndErrorMessageIsNotNullOrderByTimestampDesc(
        String username, Pageable pageable);
    
    /**
     * Find audit events by user and error message (for failed operations)
     */
    Page<AuditEvent> findByUserIdAndSuccessFalseAndErrorMessageIsNotNullOrderByTimestampDesc(
        UUID userId, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, and error message (for failed operations)
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndSuccessFalseAndErrorMessageIsNotNullOrderByTimestampDesc(
        String entityType, Operation operation, Pageable pageable);
    
    /**
     * Find audit events by module, operation, and error message (for failed operations)
     */
    Page<AuditEvent> findByModuleAndOperationAndSuccessFalseAndErrorMessageIsNotNullOrderByTimestampDesc(
        String module, Operation operation, Pageable pageable);
    
    /**
     * Find audit events by username, operation, and error message (for failed operations)
     */
    Page<AuditEvent> findByUsernameAndOperationAndSuccessFalseAndErrorMessageIsNotNullOrderByTimestampDesc(
        String username, Operation operation, Pageable pageable);
    
    /**
     * Find audit events by user, operation, and error message (for failed operations)
     */
    Page<AuditEvent> findByUserIdAndOperationAndSuccessFalseAndErrorMessageIsNotNullOrderByTimestampDesc(
        UUID userId, Operation operation, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, error message, and date range (for failed operations)
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndSuccessFalseAndErrorMessageIsNotNullAndTimestampBetweenOrderByTimestampDesc(
        String entityType, Operation operation, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by module, operation, error message, and date range (for failed operations)
     */
    Page<AuditEvent> findByModuleAndOperationAndSuccessFalseAndErrorMessageIsNotNullAndTimestampBetweenOrderByTimestampDesc(
        String module, Operation operation, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by username, operation, error message, and date range (for failed operations)
     */
    Page<AuditEvent> findByUsernameAndOperationAndSuccessFalseAndErrorMessageIsNotNullAndTimestampBetweenOrderByTimestampDesc(
        String username, Operation operation, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by user, operation, error message, and date range (for failed operations)
     */
    Page<AuditEvent> findByUserIdAndOperationAndSuccessFalseAndErrorMessageIsNotNullAndTimestampBetweenOrderByTimestampDesc(
        UUID userId, Operation operation, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by entity type and description contains
     */
    Page<AuditEvent> findByEntityTypeAndDescriptionContainingOrderByTimestampDesc(String entityType, String description, Pageable pageable);
    
    /**
     * Find audit events by operation and description contains
     */
    Page<AuditEvent> findByOperationAndDescriptionContainingOrderByTimestampDesc(Operation operation, String description, Pageable pageable);
    
    /**
     * Find audit events by module and description contains
     */
    Page<AuditEvent> findByModuleAndDescriptionContainingOrderByTimestampDesc(String module, String description, Pageable pageable);
    
    /**
     * Find audit events by username and description contains
     */
    Page<AuditEvent> findByUsernameAndDescriptionContainingOrderByTimestampDesc(String username, String description, Pageable pageable);
    
    /**
     * Find audit events by user and description contains
     */
    Page<AuditEvent> findByUserIdAndDescriptionContainingOrderByTimestampDesc(UUID userId, String description, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, and description contains
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndDescriptionContainingOrderByTimestampDesc(
        String entityType, Operation operation, String description, Pageable pageable);
    
    /**
     * Find audit events by module, operation, and description contains
     */
    Page<AuditEvent> findByModuleAndOperationAndDescriptionContainingOrderByTimestampDesc(
        String module, Operation operation, String description, Pageable pageable);
    
    /**
     * Find audit events by username, operation, and description contains
     */
    Page<AuditEvent> findByUsernameAndOperationAndDescriptionContainingOrderByTimestampDesc(
        String username, Operation operation, String description, Pageable pageable);
    
    /**
     * Find audit events by user, operation, and description contains
     */
    Page<AuditEvent> findByUserIdAndOperationAndDescriptionContainingOrderByTimestampDesc(
        UUID userId, Operation operation, String description, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, description contains, and date range
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndDescriptionContainingAndTimestampBetweenOrderByTimestampDesc(
        String entityType, Operation operation, String description, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by module, operation, description contains, and date range
     */
    Page<AuditEvent> findByModuleAndOperationAndDescriptionContainingAndTimestampBetweenOrderByTimestampDesc(
        String module, Operation operation, String description, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by username, operation, description contains, and date range
     */
    Page<AuditEvent> findByUsernameAndOperationAndDescriptionContainingAndTimestampBetweenOrderByTimestampDesc(
        String username, Operation operation, String description, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by user, operation, description contains, and date range
     */
    Page<AuditEvent> findByUserIdAndOperationAndDescriptionContainingAndTimestampBetweenOrderByTimestampDesc(
        UUID userId, Operation operation, String description, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by entity type and new values contains
     */
    Page<AuditEvent> findByEntityTypeAndNewValuesContainingOrderByTimestampDesc(String entityType, String newValues, Pageable pageable);
    
    /**
     * Find audit events by operation and new values contains
     */
    Page<AuditEvent> findByOperationAndNewValuesContainingOrderByTimestampDesc(Operation operation, String newValues, Pageable pageable);
    
    /**
     * Find audit events by module and new values contains
     */
    Page<AuditEvent> findByModuleAndNewValuesContainingOrderByTimestampDesc(String module, String newValues, Pageable pageable);
    
    /**
     * Find audit events by username and new values contains
     */
    Page<AuditEvent> findByUsernameAndNewValuesContainingOrderByTimestampDesc(String username, String newValues, Pageable pageable);
    
    /**
     * Find audit events by user and new values contains
     */
    Page<AuditEvent> findByUserIdAndNewValuesContainingOrderByTimestampDesc(UUID userId, String newValues, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, and new values contains
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndNewValuesContainingOrderByTimestampDesc(
        String entityType, Operation operation, String newValues, Pageable pageable);
    
    /**
     * Find audit events by module, operation, and new values contains
     */
    Page<AuditEvent> findByModuleAndOperationAndNewValuesContainingOrderByTimestampDesc(
        String module, Operation operation, String newValues, Pageable pageable);
    
    /**
     * Find audit events by username, operation, and new values contains
     */
    Page<AuditEvent> findByUsernameAndOperationAndNewValuesContainingOrderByTimestampDesc(
        String username, Operation operation, String newValues, Pageable pageable);
    
    /**
     * Find audit events by user, operation, and new values contains
     */
    Page<AuditEvent> findByUserIdAndOperationAndNewValuesContainingOrderByTimestampDesc(
        UUID userId, Operation operation, String newValues, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, new values contains, and date range
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndNewValuesContainingAndTimestampBetweenOrderByTimestampDesc(
        String entityType, Operation operation, String newValues, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by module, operation, new values contains, and date range
     */
    Page<AuditEvent> findByModuleAndOperationAndNewValuesContainingAndTimestampBetweenOrderByTimestampDesc(
        String module, Operation operation, String newValues, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by username, operation, new values contains, and date range
     */
    Page<AuditEvent> findByUsernameAndOperationAndNewValuesContainingAndTimestampBetweenOrderByTimestampDesc(
        String username, Operation operation, String newValues, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by user, operation, new values contains, and date range
     */
    Page<AuditEvent> findByUserIdAndOperationAndNewValuesContainingAndTimestampBetweenOrderByTimestampDesc(
        UUID userId, Operation operation, String newValues, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by entity type and old values contains
     */
    Page<AuditEvent> findByEntityTypeAndOldValuesContainingOrderByTimestampDesc(String entityType, String oldValues, Pageable pageable);
    
    /**
     * Find audit events by operation and old values contains
     */
    Page<AuditEvent> findByOperationAndOldValuesContainingOrderByTimestampDesc(Operation operation, String oldValues, Pageable pageable);
    
    /**
     * Find audit events by module and old values contains
     */
    Page<AuditEvent> findByModuleAndOldValuesContainingOrderByTimestampDesc(String module, String oldValues, Pageable pageable);
    
    /**
     * Find audit events by username and old values contains
     */
    Page<AuditEvent> findByUsernameAndOldValuesContainingOrderByTimestampDesc(String username, String oldValues, Pageable pageable);
    
    /**
     * Find audit events by user and old values contains
     */
    Page<AuditEvent> findByUserIdAndOldValuesContainingOrderByTimestampDesc(UUID userId, String oldValues, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, and old values contains
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndOldValuesContainingOrderByTimestampDesc(
        String entityType, Operation operation, String oldValues, Pageable pageable);
    
    /**
     * Find audit events by module, operation, and old values contains
     */
    Page<AuditEvent> findByModuleAndOperationAndOldValuesContainingOrderByTimestampDesc(
        String module, Operation operation, String oldValues, Pageable pageable);
    
    /**
     * Find audit events by username, operation, and old values contains
     */
    Page<AuditEvent> findByUsernameAndOperationAndOldValuesContainingOrderByTimestampDesc(
        String username, Operation operation, String oldValues, Pageable pageable);
    
    /**
     * Find audit events by user, operation, and old values contains
     */
    Page<AuditEvent> findByUserIdAndOperationAndOldValuesContainingOrderByTimestampDesc(
        UUID userId, Operation operation, String oldValues, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, old values contains, and date range
     */
    Page<AuditEvent> findByEntityTypeAndOperationAndOldValuesContainingAndTimestampBetweenOrderByTimestampDesc(
        String entityType, Operation operation, String oldValues, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by module, operation, old values contains, and date range
     */
    Page<AuditEvent> findByModuleAndOperationAndOldValuesContainingAndTimestampBetweenOrderByTimestampDesc(
        String module, Operation operation, String oldValues, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by username, operation, old values contains, and date range
     */
    Page<AuditEvent> findByUsernameAndOperationAndOldValuesContainingAndTimestampBetweenOrderByTimestampDesc(
        String username, Operation operation, String oldValues, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Find audit events by user, operation, old values contains, and date range
     */
    Page<AuditEvent> findByUserIdAndOperationAndOldValuesContainingAndTimestampBetweenOrderByTimestampDesc(
        UUID userId, Operation operation, String oldValues, OffsetDateTime start, OffsetDateTime end, Pageable pageable);
    
    /**
     * Count audit events by entity type
     */
    long countByEntityType(String entityType);
    
    /**
     * Count audit events by operation
     */
    long countByOperation(Operation operation);
    
    /**
     * Count audit events by module
     */
    long countByModule(String module);
    
    /**
     * Count audit events by success status
     */
    long countBySuccess(boolean success);
    
    /**
     * Count audit events by date range
     */
    long countByTimestampBetween(OffsetDateTime start, OffsetDateTime end);
    
    /**
     * Count audit events by entity type and operation
     */
    long countByEntityTypeAndOperation(String entityType, Operation operation);
    
    /**
     * Count audit events by module and operation
     */
    long countByModuleAndOperation(String module, Operation operation);
    
    /**
     * Count audit events by entity type and success status
     */
    long countByEntityTypeAndSuccess(String entityType, boolean success);
    
    /**
     * Count audit events by module and success status
     */
    long countByModuleAndSuccess(String module, boolean success);
    
    /**
     * Count audit events by operation and success status
     */
    long countByOperationAndSuccess(Operation operation, boolean success);
    
    /**
     * Count audit events by entity type, operation, and success status
     */
    long countByEntityTypeAndOperationAndSuccess(String entityType, Operation operation, boolean success);
    
    /**
     * Count audit events by module, operation, and success status
     */
    long countByModuleAndOperationAndSuccess(String module, Operation operation, boolean success);
    
    /**
     * Count audit events by entity type and date range
     */
    long countByEntityTypeAndTimestampBetween(String entityType, OffsetDateTime start, OffsetDateTime end);
    
    /**
     * Count audit events by module and date range
     */
    long countByModuleAndTimestampBetween(String module, OffsetDateTime start, OffsetDateTime end);
    
    /**
     * Count audit events by operation and date range
     */
    long countByOperationAndTimestampBetween(Operation operation, OffsetDateTime start, OffsetDateTime end);
    
    /**
     * Count audit events by entity type, operation, and date range
     */
    long countByEntityTypeAndOperationAndTimestampBetween(String entityType, Operation operation, OffsetDateTime start, OffsetDateTime end);
    
    /**
     * Count audit events by module, operation, and date range
     */
    long countByModuleAndOperationAndTimestampBetween(String module, Operation operation, OffsetDateTime start, OffsetDateTime end);
    
    /**
     * Count audit events by entity type, operation, success status, and date range
     */
    long countByEntityTypeAndOperationAndSuccessAndTimestampBetween(String entityType, Operation operation, boolean success, OffsetDateTime start, OffsetDateTime end);
    
    /**
     * Count audit events by module, operation, success status, and date range
     */
    long countByModuleAndOperationAndSuccessAndTimestampBetween(String module, Operation operation, boolean success, OffsetDateTime start, OffsetDateTime end);
    
    /**
     * Find audit events by entity type and operation with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationWithPagination(@Param("entityType") String entityType, @Param("operation") Operation operation, Pageable pageable);
    
    /**
     * Find audit events by module and operation with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationWithPagination(@Param("module") String module, @Param("operation") Operation operation, Pageable pageable);
    
    /**
     * Find audit events by username and operation with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationWithPagination(@Param("username") String username, @Param("operation") Operation operation, Pageable pageable);
    
    /**
     * Find audit events by user and operation with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationWithPagination(@Param("userId") UUID userId, @Param("operation") Operation operation, Pageable pageable);
    
    /**
     * Find audit events by entity type and module with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.module = :module ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndModuleWithPagination(@Param("entityType") String entityType, @Param("module") String module, Pageable pageable);
    
    /**
     * Find audit events by username and module with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.module = :module ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndModuleWithPagination(@Param("username") String username, @Param("module") String module, Pageable pageable);
    
    /**
     * Find audit events by user and module with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.module = :module ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndModuleWithPagination(@Param("userId") UUID userId, @Param("module") String module, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, and module with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.module = :module ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndModuleWithPagination(@Param("entityType") String entityType, @Param("operation") Operation operation, @Param("module") String module, Pageable pageable);
    
    /**
     * Find audit events by username, operation, and module with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.module = :module ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndModuleWithPagination(@Param("username") String username, @Param("operation") Operation operation, @Param("module") String module, Pageable pageable);
    
    /**
     * Find audit events by user, operation, and module with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.module = :module ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndModuleWithPagination(@Param("userId") UUID userId, @Param("operation") Operation operation, @Param("module") String module, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, module, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.module = :module AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndModuleAndTimestampBetweenWithPagination(
        @Param("entityType") String entityType, 
        @Param("operation") Operation operation, 
        @Param("module") String module, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by username, operation, module, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.module = :module AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndModuleAndTimestampBetweenWithPagination(
        @Param("username") String username, 
        @Param("operation") Operation operation, 
        @Param("module") String module, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by user, operation, module, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.module = :module AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndModuleAndTimestampBetweenWithPagination(
        @Param("userId") UUID userId, 
        @Param("operation") Operation operation, 
        @Param("module") String module, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by entity type and operation with success status and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.success = :success ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndSuccessWithPagination(@Param("entityType") String entityType, @Param("operation") Operation operation, @Param("success") boolean success, Pageable pageable);
    
    /**
     * Find audit events by module and operation with success status and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.success = :success ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndSuccessWithPagination(@Param("module") String module, @Param("operation") Operation operation, @Param("success") boolean success, Pageable pageable);
    
    /**
     * Find audit events by username and operation with success status and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.success = :success ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndSuccessWithPagination(@Param("username") String username, @Param("operation") Operation operation, @Param("success") boolean success, Pageable pageable);
    
    /**
     * Find audit events by user and operation with success status and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.success = :success ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndSuccessWithPagination(@Param("userId") UUID userId, @Param("operation") Operation operation, @Param("success") boolean success, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, success status, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.success = :success AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndSuccessAndTimestampBetweenWithPagination(
        @Param("entityType") String entityType, 
        @Param("operation") Operation operation, 
        @Param("success") boolean success, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by module, operation, success status, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.success = :success AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndSuccessAndTimestampBetweenWithPagination(
        @Param("module") String module, 
        @Param("operation") Operation operation, 
        @Param("success") boolean success, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by username, operation, success status, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.success = :success AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndSuccessAndTimestampBetweenWithPagination(
        @Param("username") String username, 
        @Param("operation") Operation operation, 
        @Param("success") boolean success, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by user, operation, success status, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.success = :success AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndSuccessAndTimestampBetweenWithPagination(
        @Param("userId") UUID userId, 
        @Param("operation") Operation operation, 
        @Param("success") boolean success, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by entity type and operation with IP address and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.ipAddress = :ipAddress ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndIpAddressWithPagination(@Param("entityType") String entityType, @Param("operation") Operation operation, @Param("ipAddress") String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by module and operation with IP address and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.ipAddress = :ipAddress ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndIpAddressWithPagination(@Param("module") String module, @Param("operation") Operation operation, @Param("ipAddress") String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by username and operation with IP address and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.ipAddress = :ipAddress ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndIpAddressWithPagination(@Param("username") String username, @Param("operation") Operation operation, @Param("ipAddress") String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by user and operation with IP address and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.ipAddress = :ipAddress ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndIpAddressWithPagination(@Param("userId") UUID userId, @Param("operation") Operation operation, @Param("ipAddress") String ipAddress, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, IP address, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.ipAddress = :ipAddress AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndIpAddressAndTimestampBetweenWithPagination(
        @Param("entityType") String entityType, 
        @Param("operation") Operation operation, 
        @Param("ipAddress") String ipAddress, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by module, operation, IP address, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.ipAddress = :ipAddress AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndIpAddressAndTimestampBetweenWithPagination(
        @Param("module") String module, 
        @Param("operation") Operation operation, 
        @Param("ipAddress") String ipAddress, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by username, operation, IP address, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.ipAddress = :ipAddress AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndIpAddressAndTimestampBetweenWithPagination(
        @Param("username") String username, 
        @Param("operation") Operation operation, 
        @Param("ipAddress") String ipAddress, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by user, operation, IP address, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.ipAddress = :ipAddress AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndIpAddressAndTimestampBetweenWithPagination(
        @Param("userId") UUID userId, 
        @Param("operation") Operation operation, 
        @Param("ipAddress") String ipAddress, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by entity type and operation with error message (for failed operations) and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.success = false AND ae.errorMessage IS NOT NULL ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndSuccessFalseAndErrorMessageIsNotNullWithPagination(@Param("entityType") String entityType, @Param("operation") Operation operation, Pageable pageable);
    
    /**
     * Find audit events by module and operation with error message (for failed operations) and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.success = false AND ae.errorMessage IS NOT NULL ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndSuccessFalseAndErrorMessageIsNotNullWithPagination(@Param("module") String module, @Param("operation") Operation operation, Pageable pageable);
    
    /**
     * Find audit events by username and operation with error message (for failed operations) and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.success = false AND ae.errorMessage IS NOT NULL ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndSuccessFalseAndErrorMessageIsNotNullWithPagination(@Param("username") String username, @Param("operation") Operation operation, Pageable pageable);
    
    /**
     * Find audit events by user and operation with error message (for failed operations) and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.success = false AND ae.errorMessage IS NOT NULL ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndSuccessFalseAndErrorMessageIsNotNullWithPagination(@Param("userId") UUID userId, @Param("operation") Operation operation, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, error message (for failed operations), and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.success = false AND ae.errorMessage IS NOT NULL AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndSuccessFalseAndErrorMessageIsNotNullAndTimestampBetweenWithPagination(
        @Param("entityType") String entityType, 
        @Param("operation") Operation operation, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by module, operation, error message (for failed operations), and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.success = false AND ae.errorMessage IS NOT NULL AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndSuccessFalseAndErrorMessageIsNotNullAndTimestampBetweenWithPagination(
        @Param("module") String module, 
        @Param("operation") Operation operation, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by username, operation, error message (for failed operations), and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.success = false AND ae.errorMessage IS NOT NULL AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndSuccessFalseAndErrorMessageIsNotNullAndTimestampBetweenWithPagination(
        @Param("username") String username, 
        @Param("operation") Operation operation, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by user, operation, error message (for failed operations), and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.success = false AND ae.errorMessage IS NOT NULL AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndSuccessFalseAndErrorMessageIsNotNullAndTimestampBetweenWithPagination(
        @Param("userId") UUID userId, 
        @Param("operation") Operation operation, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by entity type and operation with description contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.description LIKE %:description% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndDescriptionContainingWithPagination(@Param("entityType") String entityType, @Param("operation") Operation operation, @Param("description") String description, Pageable pageable);
    
    /**
     * Find audit events by module and operation with description contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.description LIKE %:description% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndDescriptionContainingWithPagination(@Param("module") String module, @Param("operation") Operation operation, @Param("description") String description, Pageable pageable);
    
    /**
     * Find audit events by username and operation with description contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.description LIKE %:description% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndDescriptionContainingWithPagination(@Param("username") String username, @Param("operation") Operation operation, @Param("description") String description, Pageable pageable);
    
    /**
     * Find audit events by user and operation with description contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.description LIKE %:description% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndDescriptionContainingWithPagination(@Param("userId") UUID userId, @Param("operation") Operation operation, @Param("description") String description, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, description contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.description LIKE %:description% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndDescriptionContainingAndTimestampBetweenWithPagination(
        @Param("entityType") String entityType, 
        @Param("operation") Operation operation, 
        @Param("description") String description, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by module, operation, description contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.description LIKE %:description% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndDescriptionContainingAndTimestampBetweenWithPagination(
        @Param("module") String module, 
        @Param("operation") Operation operation, 
        @Param("description") String description, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by username, operation, description contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.description LIKE %:description% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndDescriptionContainingAndTimestampBetweenWithPagination(
        @Param("username") String username, 
        @Param("operation") Operation operation, 
        @Param("description") String description, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by user, operation, description contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.description LIKE %:description% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndDescriptionContainingAndTimestampBetweenWithPagination(
        @Param("userId") UUID userId, 
        @Param("operation") Operation operation, 
        @Param("description") String description, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by entity type and operation with new values contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.newValues LIKE %:newValues% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndNewValuesContainingWithPagination(@Param("entityType") String entityType, @Param("operation") Operation operation, @Param("newValues") String newValues, Pageable pageable);
    
    /**
     * Find audit events by module and operation with new values contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.newValues LIKE %:newValues% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndNewValuesContainingWithPagination(@Param("module") String module, @Param("operation") Operation operation, @Param("newValues") String newValues, Pageable pageable);
    
    /**
     * Find audit events by username and operation with new values contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.newValues LIKE %:newValues% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndNewValuesContainingWithPagination(@Param("username") String username, @Param("operation") Operation operation, @Param("newValues") String newValues, Pageable pageable);
    
    /**
     * Find audit events by user and operation with new values contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.newValues LIKE %:newValues% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndNewValuesContainingWithPagination(@Param("userId") UUID userId, @Param("operation") Operation operation, @Param("newValues") String newValues, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, new values contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.newValues LIKE %:newValues% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndNewValuesContainingAndTimestampBetweenWithPagination(
        @Param("entityType") String entityType, 
        @Param("operation") Operation operation, 
        @Param("newValues") String newValues, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by module, operation, new values contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.newValues LIKE %:newValues% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndNewValuesContainingAndTimestampBetweenWithPagination(
        @Param("module") String module, 
        @Param("operation") Operation operation, 
        @Param("newValues") String newValues, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by username, operation, new values contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.newValues LIKE %:newValues% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndNewValuesContainingAndTimestampBetweenWithPagination(
        @Param("username") String username, 
        @Param("operation") Operation operation, 
        @Param("newValues") String newValues, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by user, operation, new values contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.newValues LIKE %:newValues% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndNewValuesContainingAndTimestampBetweenWithPagination(
        @Param("userId") UUID userId, 
        @Param("operation") Operation operation, 
        @Param("newValues") String newValues, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by entity type and operation with old values contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.oldValues LIKE %:oldValues% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndOldValuesContainingWithPagination(@Param("entityType") String entityType, @Param("operation") Operation operation, @Param("oldValues") String oldValues, Pageable pageable);
    
    /**
     * Find audit events by module and operation with old values contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.oldValues LIKE %:oldValues% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndOldValuesContainingWithPagination(@Param("module") String module, @Param("operation") Operation operation, @Param("oldValues") String oldValues, Pageable pageable);
    
    /**
     * Find audit events by username and operation with old values contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.oldValues LIKE %:oldValues% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndOldValuesContainingWithPagination(@Param("username") String username, @Param("operation") Operation operation, @Param("oldValues") String oldValues, Pageable pageable);
    
    /**
     * Find audit events by user and operation with old values contains and pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.oldValues LIKE %:oldValues% ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndOldValuesContainingWithPagination(@Param("userId") UUID userId, @Param("operation") Operation operation, @Param("oldValues") String oldValues, Pageable pageable);
    
    /**
     * Find audit events by entity type, operation, old values contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.entityType = :entityType AND ae.operation = :operation AND ae.oldValues LIKE %:oldValues% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByEntityTypeAndOperationAndOldValuesContainingAndTimestampBetweenWithPagination(
        @Param("entityType") String entityType, 
        @Param("operation") Operation operation, 
        @Param("oldValues") String oldValues, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by module, operation, old values contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.module = :module AND ae.operation = :operation AND ae.oldValues LIKE %:oldValues% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByModuleAndOperationAndOldValuesContainingAndTimestampBetweenWithPagination(
        @Param("module") String module, 
        @Param("operation") Operation operation, 
        @Param("oldValues") String oldValues, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by username, operation, old values contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.username = :username AND ae.operation = :operation AND ae.oldValues LIKE %:oldValues% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUsernameAndOperationAndOldValuesContainingAndTimestampBetweenWithPagination(
        @Param("username") String username, 
        @Param("operation") Operation operation, 
        @Param("oldValues") String oldValues, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
    
    /**
     * Find audit events by user, operation, old values contains, and date range with pagination
     */
    @Query("SELECT ae FROM AuditEvent ae WHERE ae.userId = :userId AND ae.operation = :operation AND ae.oldValues LIKE %:oldValues% AND ae.timestamp BETWEEN :start AND :end ORDER BY ae.timestamp DESC")
    Page<AuditEvent> findByUserIdAndOperationAndOldValuesContainingAndTimestampBetweenWithPagination(
        @Param("userId") UUID userId, 
        @Param("operation") Operation operation, 
        @Param("oldValues") String oldValues, 
        @Param("start") OffsetDateTime start, 
        @Param("end") OffsetDateTime end, 
        Pageable pageable);
}