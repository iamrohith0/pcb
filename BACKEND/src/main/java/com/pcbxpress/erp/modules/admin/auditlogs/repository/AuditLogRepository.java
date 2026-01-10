package com.pcbxpress.erp.modules.admin.auditlogs.repository;

import com.pcbxpress.erp.modules.admin.auditlogs.model.AuditLog;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Admin Audit Logs
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    
    /**
     * Find audit log by log ID
     */
    AuditLog findByLogId(String logId);
    
    /**
     * Find audit logs by actor
     */
    List<AuditLog> findByActor(String actor);
    
    /**
     * Find audit logs by module
     */
    List<AuditLog> findByModule(String module);
    
    /**
     * Find audit logs by action
     */
    List<AuditLog> findByAction(String action);
    
    /**
     * Find audit logs by entity
     */
    List<AuditLog> findByEntity(String entity);
    
    /**
     * Find audit logs by severity
     */
    List<AuditLog> findBySeverity(AuditLog.Severity severity);
    
    /**
     * Find audit logs by IP address
     */
    List<AuditLog> findByIpAddress(String ipAddress);
    
    /**
     * Find audit logs by session ID
     */
    List<AuditLog> findBySessionId(String sessionId);
    
    /**
     * Find audit logs by request ID
     */
    List<AuditLog> findByRequestId(String requestId);
    
    /**
     * Find audit logs by timestamp range
     */
    List<AuditLog> findByTimestampBetween(OffsetDateTime from, OffsetDateTime to);
    
    /**
     * Find audit logs by actor and timestamp range
     */
    List<AuditLog> findByActorAndTimestampBetween(String actor, OffsetDateTime from, OffsetDateTime to);
    
    /**
     * Find audit logs by module and timestamp range
     */
    List<AuditLog> findByModuleAndTimestampBetween(String module, OffsetDateTime from, OffsetDateTime to);
    
    /**
     * Find audit logs by severity and timestamp range
     */
    List<AuditLog> findBySeverityAndTimestampBetween(AuditLog.Severity severity, OffsetDateTime from, OffsetDateTime to);
    
    /**
     * Find audit logs by multiple criteria
     */
    @Query("SELECT al FROM AuditLog al WHERE " +
           "(:from IS NULL OR al.timestamp >= :from) " +
           "AND (:to IS NULL OR al.timestamp <= :to) " +
           "AND (:actor IS NULL OR LOWER(al.actor) LIKE LOWER(CONCAT('%', :actor, '%'))) " +
           "AND (:module IS NULL OR LOWER(al.module) LIKE LOWER(CONCAT('%', :module, '%'))) " +
           "AND (:action IS NULL OR LOWER(al.action) LIKE LOWER(CONCAT('%', :action, '%'))) " +
           "AND (:entity IS NULL OR LOWER(al.entity) LIKE LOWER(CONCAT('%', :entity, '%'))) " +
           "AND (:severity IS NULL OR al.severity = :severity) " +
           "AND (:ipAddress IS NULL OR LOWER(al.ipAddress) LIKE LOWER(CONCAT('%', :ipAddress, '%'))) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(al.message) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(al.logId) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(al.entityId) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<AuditLog> findByCriteria(@Param("from") OffsetDateTime from,
                                 @Param("to") OffsetDateTime to,
                                 @Param("actor") String actor,
                                 @Param("module") String module,
                                 @Param("action") String action,
                                 @Param("entity") String entity,
                                 @Param("severity") AuditLog.Severity severity,
                                 @Param("ipAddress") String ipAddress,
                                 @Param("searchText") String searchText);
    
    /**
     * Find audit logs by criteria with pagination
     */
    @Query("SELECT al FROM AuditLog al WHERE " +
           "(:from IS NULL OR al.timestamp >= :from) " +
           "AND (:to IS NULL OR al.timestamp <= :to) " +
           "AND (:actor IS NULL OR LOWER(al.actor) LIKE LOWER(CONCAT('%', :actor, '%'))) " +
           "AND (:module IS NULL OR LOWER(al.module) LIKE LOWER(CONCAT('%', :module, '%'))) " +
           "AND (:action IS NULL OR LOWER(al.action) LIKE LOWER(CONCAT('%', :action, '%'))) " +
           "AND (:entity IS NULL OR LOWER(al.entity) LIKE LOWER(CONCAT('%', :entity, '%'))) " +
           "AND (:severity IS NULL OR al.severity = :severity) " +
           "AND (:ipAddress IS NULL OR LOWER(al.ipAddress) LIKE LOWER(CONCAT('%', :ipAddress, '%'))) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(al.message) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(al.logId) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(al.entityId) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    Page<AuditLog> findByCriteriaWithPagination(@Param("from") OffsetDateTime from,
                                               @Param("to") OffsetDateTime to,
                                               @Param("actor") String actor,
                                               @Param("module") String module,
                                               @Param("action") String action,
                                               @Param("entity") String entity,
                                               @Param("severity") AuditLog.Severity severity,
                                               @Param("ipAddress") String ipAddress,
                                               @Param("searchText") String searchText,
                                               Pageable pageable);
    
    /**
     * Count audit logs by severity
     */
    long countBySeverity(AuditLog.Severity severity);
    
    /**
     * Count audit logs by module
     */
    long countByModule(String module);
    
    /**
     * Count audit logs by action
     */
    long countByAction(String action);
    
    /**
     * Count audit logs by actor
     */
    long countByActor(String actor);
    
    /**
     * Count audit logs by timestamp range
     */
    long countByTimestampBetween(OffsetDateTime from, OffsetDateTime to);
    
    /**
     * Find recent audit logs by actor
     */
    @Query("SELECT al FROM AuditLog al WHERE al.actor = :actor ORDER BY al.timestamp DESC")
    List<AuditLog> findRecentByActor(@Param("actor") String actor);
    
    /**
     * Find recent audit logs by module
     */
    @Query("SELECT al FROM AuditLog al WHERE al.module = :module ORDER BY al.timestamp DESC")
    List<AuditLog> findRecentByModule(@Param("module") String module);
    
    /**
     * Find audit logs with critical severity
     */
    List<AuditLog> findBySeverityOrderByTimestampDesc(AuditLog.Severity severity);
    
    /**
     * Find audit logs by entity and entity ID
     */
    List<AuditLog> findByEntityAndEntityId(String entity, String entityId);
    
    /**
     * Find audit logs older than specified timestamp
     */
    List<AuditLog> findByTimestampLessThan(OffsetDateTime cutoff);
}