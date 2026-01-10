package com.pcbxpress.erp.modules.admin.auditlogs.dto;

import com.pcbxpress.erp.modules.admin.auditlogs.model.AuditLog;
import java.time.OffsetDateTime;

/**
 * Data Transfer Object for Audit Logs
 */
public record AuditLogDto(
    String id,
    String logId,
    OffsetDateTime timestamp,
    AuditLog.Severity severity,
    String module,
    String action,
    String entity,
    String entityId,
    String actor,
    String ipAddress,
    String userAgent,
    String message,
    String beforeData,
    String afterData,
    String sessionId,
    String requestId,
    String metadata,
    OffsetDateTime createdAt
) {
}