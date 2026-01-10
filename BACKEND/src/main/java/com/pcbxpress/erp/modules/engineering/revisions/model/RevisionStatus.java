package com.pcbxpress.erp.modules.engineering.revisions.model;

public enum RevisionStatus {
    DRAFT("Draft"),
    PENDING_APPROVAL("Pending Approval"),
    APPROVED("Approved"),
    IMPLEMENTED("Implemented"),
    OBSOLETE("Obsolete"),
    ARCHIVED("Archived");
    
    private final String displayName;
    
    RevisionStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}