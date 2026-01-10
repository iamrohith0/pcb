package com.pcbxpress.erp.modules.engineering.revisions.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "eco_change_requests", indexes = {
    @Index(name = "idx_eco_requests_number", columnList = "changeRequestNumber"),
    @Index(name = "idx_eco_requests_status", columnList = "status"),
    @Index(name = "idx_eco_requests_job_id", columnList = "jobId"),
    @Index(name = "idx_eco_requests_created_at", columnList = "createdAt"),
    @Index(name = "idx_eco_requests_updated_at", columnList = "updatedAt")
})
public class ECOChangeRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "change_request_number", nullable = false, length = 50, unique = true)
    private String changeRequestNumber;
    
    @Column(name = "job_id", columnDefinition = "uuid")
    private UUID jobId;
    
    @Column(name = "job_number", length = 50)
    private String jobNumber;
    
    @Column(name = "part_number", length = 100)
    private String partNumber;
    
    @Column(name = "revision", length = 20)
    private String revision;
    
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @Column(name = "description", columnDefinition = "text")
    private String description;
    
    @Column(name = "change_type", nullable = false, length = 50)
    private String changeType;
    
    @Column(name = "reason", columnDefinition = "text")
    private String reason;
    
    @Column(name = "impact_analysis", columnDefinition = "text")
    private String impactAnalysis;
    
    @Column(name = "affected_documents", columnDefinition = "text")
    private String affectedDocuments;
    
    @Column(name = "affected_parts", columnDefinition = "text")
    private String affectedParts;
    
    @Column(name = "estimated_cost")
    private Double estimatedCost;
    
    @Column(name = "estimated_hours")
    private Double estimatedHours;
    
    @Column(name = "priority", nullable = false, length = 20)
    private String priority;
    
    @Column(name = "requested_by", columnDefinition = "uuid")
    private UUID requestedBy;
    
    @Column(name = "requested_by_name", length = 200)
    private String requestedByName;
    
    @Column(name = "assigned_to", columnDefinition = "uuid")
    private UUID assignedTo;
    
    @Column(name = "assigned_to_name", length = 200)
    private String assignedToName;
    
    @Column(name = "due_date")
    private OffsetDateTime dueDate;
    
    @Column(name = "target_implementation_date")
    private OffsetDateTime targetImplementationDate;
    
    @Column(name = "actual_implementation_date")
    private OffsetDateTime actualImplementationDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ECOStatus status;
    
    @Column(name = "approved_by", columnDefinition = "uuid")
    private UUID approvedBy;
    
    @Column(name = "approved_by_name", length = 200)
    private String approvedByName;
    
    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;
    
    @Column(name = "rejected_by", columnDefinition = "uuid")
    private UUID rejectedBy;
    
    @Column(name = "rejected_by_name", length = 200)
    private String rejectedByName;
    
    @Column(name = "rejected_at")
    private OffsetDateTime rejectedAt;
    
    @Column(name = "rejected_reason", columnDefinition = "text")
    private String rejectedReason;
    
    @Column(name = "closed_by", columnDefinition = "uuid")
    private UUID closedBy;
    
    @Column(name = "closed_by_name", length = 200)
    private String closedByName;
    
    @Column(name = "closed_at")
    private OffsetDateTime closedAt;
    
    @Column(name = "closure_notes", columnDefinition = "text")
    private String closureNotes;
    
    @Column(name = "version")
    private Integer version;
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    // Getters and Setters
    
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getChangeRequestNumber() {
        return changeRequestNumber;
    }
    
    public void setChangeRequestNumber(String changeRequestNumber) {
        this.changeRequestNumber = changeRequestNumber;
    }
    
    public UUID getJobId() {
        return jobId;
    }
    
    public void setJobId(UUID jobId) {
        this.jobId = jobId;
    }
    
    public String getJobNumber() {
        return jobNumber;
    }
    
    public void setJobNumber(String jobNumber) {
        this.jobNumber = jobNumber;
    }
    
    public String getPartNumber() {
        return partNumber;
    }
    
    public void setPartNumber(String partNumber) {
        this.partNumber = partNumber;
    }
    
    public String getRevision() {
        return revision;
    }
    
    public void setRevision(String revision) {
        this.revision = revision;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getChangeType() {
        return changeType;
    }
    
    public void setChangeType(String changeType) {
        this.changeType = changeType;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public String getImpactAnalysis() {
        return impactAnalysis;
    }
    
    public void setImpactAnalysis(String impactAnalysis) {
        this.impactAnalysis = impactAnalysis;
    }
    
    public String getAffectedDocuments() {
        return affectedDocuments;
    }
    
    public void setAffectedDocuments(String affectedDocuments) {
        this.affectedDocuments = affectedDocuments;
    }
    
    public String getAffectedParts() {
        return affectedParts;
    }
    
    public void setAffectedParts(String affectedParts) {
        this.affectedParts = affectedParts;
    }
    
    public Double getEstimatedCost() {
        return estimatedCost;
    }
    
    public void setEstimatedCost(Double estimatedCost) {
        this.estimatedCost = estimatedCost;
    }
    
    public Double getEstimatedHours() {
        return estimatedHours;
    }
    
    public void setEstimatedHours(Double estimatedHours) {
        this.estimatedHours = estimatedHours;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public UUID getRequestedBy() {
        return requestedBy;
    }
    
    public void setRequestedBy(UUID requestedBy) {
        this.requestedBy = requestedBy;
    }
    
    public String getRequestedByName() {
        return requestedByName;
    }
    
    public void setRequestedByName(String requestedByName) {
        this.requestedByName = requestedByName;
    }
    
    public UUID getAssignedTo() {
        return assignedTo;
    }
    
    public void setAssignedTo(UUID assignedTo) {
        this.assignedTo = assignedTo;
    }
    
    public String getAssignedToName() {
        return assignedToName;
    }
    
    public void setAssignedToName(String assignedToName) {
        this.assignedToName = assignedToName;
    }
    
    public OffsetDateTime getDueDate() {
        return dueDate;
    }
    
    public void setDueDate(OffsetDateTime dueDate) {
        this.dueDate = dueDate;
    }
    
    public OffsetDateTime getTargetImplementationDate() {
        return targetImplementationDate;
    }
    
    public void setTargetImplementationDate(OffsetDateTime targetImplementationDate) {
        this.targetImplementationDate = targetImplementationDate;
    }
    
    public OffsetDateTime getActualImplementationDate() {
        return actualImplementationDate;
    }
    
    public void setActualImplementationDate(OffsetDateTime actualImplementationDate) {
        this.actualImplementationDate = actualImplementationDate;
    }
    
    public ECOStatus getStatus() {
        return status;
    }
    
    public void setStatus(ECOStatus status) {
        this.status = status;
    }
    
    public UUID getApprovedBy() {
        return approvedBy;
    }
    
    public void setApprovedBy(UUID approvedBy) {
        this.approvedBy = approvedBy;
    }
    
    public String getApprovedByName() {
        return approvedByName;
    }
    
    public void setApprovedByName(String approvedByName) {
        this.approvedByName = approvedByName;
    }
    
    public OffsetDateTime getApprovedAt() {
        return approvedAt;
    }
    
    public void setApprovedAt(OffsetDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
    
    public UUID getRejectedBy() {
        return rejectedBy;
    }
    
    public void setRejectedBy(UUID rejectedBy) {
        this.rejectedBy = rejectedBy;
    }
    
    public String getRejectedByName() {
        return rejectedByName;
    }
    
    public void setRejectedByName(String rejectedByName) {
        this.rejectedByName = rejectedByName;
    }
    
    public OffsetDateTime getRejectedAt() {
        return rejectedAt;
    }
    
    public void setRejectedAt(OffsetDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }
    
    public String getRejectedReason() {
        return rejectedReason;
    }
    
    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }
    
    public UUID getClosedBy() {
        return closedBy;
    }
    
    public void setClosedBy(UUID closedBy) {
        this.closedBy = closedBy;
    }
    
    public String getClosedByName() {
        return closedByName;
    }
    
    public void setClosedByName(String closedByName) {
        this.closedByName = closedByName;
    }
    
    public OffsetDateTime getClosedAt() {
        return closedAt;
    }
    
    public void setClosedAt(OffsetDateTime closedAt) {
        this.closedAt = closedAt;
    }
    
    public String getClosureNotes() {
        return closureNotes;
    }
    
    public void setClosureNotes(String closureNotes) {
        this.closureNotes = closureNotes;
    }
    
    public Integer getVersion() {
        return version;
    }
    
    public void setVersion(Integer version) {
        this.version = version;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}