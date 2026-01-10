package com.pcbxpress.erp.modules.admin.auditlogs.service;

import com.pcbxpress.erp.modules.admin.auditlogs.dto.AuditLogDto;
import com.pcbxpress.erp.modules.admin.auditlogs.dto.AuditLogPayload;
import com.pcbxpress.erp.modules.admin.auditlogs.model.AuditLog;
import com.pcbxpress.erp.modules.admin.auditlogs.repository.AuditLogRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing Admin Audit Logs
 */
@Service
@Transactional
public class AuditLogService {
    
    private final AuditLogRepository auditLogRepository;
    
    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }
    
    /**
     * List audit logs with optional filters and pagination
     */
    public List<AuditLogDto> list(String query, String module, String action, AuditLog.Severity severity, 
                                 String actor, String entity, String from, String to, int page, int size) {
        OffsetDateTime fromTime = parseOffsetDateTime(from);
        OffsetDateTime toTime = parseOffsetDateTime(to);
        
        Pageable pageable = PageRequest.of(page - 1, size);
        Page<AuditLog> auditLogs = auditLogRepository.findByCriteriaWithPagination(
            fromTime, toTime, actor, module, action, entity, severity, null, query, pageable);
        
        return auditLogs.getContent().stream()
            .sorted((a1, a2) -> a2.getTimestamp().compareTo(a1.getTimestamp()))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single audit log by ID
     */
    public AuditLogDto get(String id) {
        AuditLog auditLog = auditLogRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Audit log not found: " + id));
        return toDto(auditLog);
    }
    
    /**
     * Create a new audit log
     */
    public AuditLogDto create(AuditLogPayload payload) {
        AuditLog auditLog = new AuditLog();
        auditLog.setId(UUID.randomUUID());
        applyPayload(auditLog, payload);
        
        AuditLog saved = auditLogRepository.save(auditLog);
        return toDto(saved);
    }
    
    /**
     * Delete an audit log
     */
    public void delete(String id) {
        auditLogRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete audit logs older than specified date
     */
    public void deleteOlderThan(OffsetDateTime cutoff) {
        List<AuditLog> oldLogs = auditLogRepository.findByTimestampLessThan(cutoff);
        auditLogRepository.deleteAll(oldLogs);
    }
    
    /**
     * Search audit logs by query
     */
    public List<AuditLogDto> search(String query) {
        return auditLogRepository.findByCriteria(null, null, null, null, null, null, null, null, query).stream()
            .sorted((a1, a2) -> a2.getTimestamp().compareTo(a1.getTimestamp()))
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get audit log statistics
     */
    public Map<String, Object> getStats() {
        List<AuditLog> all = auditLogRepository.findAll();
        long total = all.size();
        
        // Count by severity
        Map<AuditLog.Severity, Long> bySeverity = all.stream()
            .collect(Collectors.groupingBy(AuditLog::getSeverity, Collectors.counting()));
        
        // Count by module
        Map<String, Long> byModule = all.stream()
            .collect(Collectors.groupingBy(AuditLog::getModule, Collectors.counting()));
        
        // Count by action
        Map<String, Long> byAction = all.stream()
            .collect(Collectors.groupingBy(AuditLog::getAction, Collectors.counting()));
        
        // Count by entity
        Map<String, Long> byEntity = all.stream()
            .collect(Collectors.groupingBy(AuditLog::getEntity, Collectors.counting()));
        
        // Recent activity (last 24 hours)
        OffsetDateTime yesterday = OffsetDateTime.now().minusHours(24);
        long recentCount = auditLogRepository.countByTimestampBetween(yesterday, OffsetDateTime.now());
        
        return Map.of(
            "total", total,
            "bySeverity", bySeverity,
            "byModule", byModule,
            "byAction", byAction,
            "byEntity", byEntity,
            "recent24h", recentCount
        );
    }
    
    /**
     * Export audit logs to CSV format
     */
    public String exportCsv(List<AuditLogDto> data) {
        String header = "Log ID,Timestamp,Severity,Module,Action,Entity,Entity ID,Actor,IP Address,Message";
        String rows = data.stream()
            .map(log -> String.join(",",
                safe(log.logId()),
                log.timestamp() != null ? log.timestamp().toString() : "",
                safe(log.severity() != null ? log.severity().toString() : ""),
                safe(log.module()),
                safe(log.action()),
                safe(log.entity()),
                safe(log.entityId()),
                safe(log.actor()),
                safe(log.ipAddress()),
                safe(log.message())
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Audit log not found: " + id);
        }
    }
    
    private static OffsetDateTime parseOffsetDateTime(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return OffsetDateTime.parse(value);
        } catch (Exception ex) {
            return null;
        }
    }
    
    private void applyPayload(AuditLog target, AuditLogPayload payload) {
        target.setLogId(payload.logId());
        target.setSeverity(payload.severity());
        target.setModule(payload.module());
        target.setAction(payload.action());
        target.setEntity(payload.entity());
        target.setEntityId(payload.entityId());
        target.setActor(payload.actor());
        target.setIpAddress(payload.ipAddress());
        target.setUserAgent(payload.userAgent());
        target.setMessage(payload.message());
        target.setBeforeData(payload.beforeData());
        target.setAfterData(payload.afterData());
        target.setSessionId(payload.sessionId());
        target.setRequestId(payload.requestId());
        target.setMetadata(payload.metadata());
    }
    
    private AuditLogDto toDto(AuditLog auditLog) {
        return new AuditLogDto(
            auditLog.getId().toString(),
            auditLog.getLogId(),
            auditLog.getTimestamp(),
            auditLog.getSeverity(),
            auditLog.getModule(),
            auditLog.getAction(),
            auditLog.getEntity(),
            auditLog.getEntityId(),
            auditLog.getActor(),
            auditLog.getIpAddress(),
            auditLog.getUserAgent(),
            auditLog.getMessage(),
            auditLog.getBeforeData(),
            auditLog.getAfterData(),
            auditLog.getSessionId(),
            auditLog.getRequestId(),
            auditLog.getMetadata(),
            auditLog.getCreatedAt()
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
}