package com.pcbxpress.erp.modules.engineering.revisions.model;

public enum ECOStatus {
    DRAFT("Draft"),
    SUBMITTED("Submitted"),
    UNDER_REVIEW("Under Review"),
    APPROVED("Approved"),
    REJECTED("Rejected"),
    IMPLEMENTING("Implementing"),
    IMPLEMENTED("Implemented"),
    CLOSED("Closed");
    
    private final String displayName;
    
    ECOStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}