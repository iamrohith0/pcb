package com.pcbxpress.erp.modules.sales.common;

public record ComplianceInfo(
    boolean ndaRequired,
    boolean ipSensitive,
    boolean exportRestricted
) {
}
