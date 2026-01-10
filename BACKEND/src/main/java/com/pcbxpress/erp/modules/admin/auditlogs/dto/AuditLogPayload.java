package com.pcbxpress.erp.modules.admin.auditlogs.dto;

import com.pcbxpress.erp.modules.admin.auditlogs.model.AuditLog;

/**
 * Payload DTO for creating Audit Logs
 */
public record AuditLogPayload(
    String logId,
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
    String metadata
) {
}