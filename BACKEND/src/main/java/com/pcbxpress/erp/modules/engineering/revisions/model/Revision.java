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
@Table(name = "revisions", indexes = {
    @Index(name = "idx_revisions_job_id", columnList = "jobId"),
    @Index(name = "idx_revisions_part_number", columnList = "partNumber"),
    @Index(name = "idx_revisions_revision", columnList = "revision"),
    @Index(name = "idx_revisions_status", columnList = "status"),
    @Index(name = "idx_revisions_created_at", columnList = "createdAt"),
    @Index(name = "idx_revisions_updated_at", columnList = "updatedAt")
})
public class Revision {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "job_id", columnDefinition = "uuid")
    private UUID jobId;
    
    @Column(name = "job_number", length = 50)
    private String jobNumber;
    
    @Column(name = "part_number", nullable = false, length = 100)
    private String partNumber;
    
    @Column(nullable = false, length = 20)
    private String revision;
    
    @Column(name = "revision_date")
    private OffsetDateTime revisionDate;
    
    @Column(name = "revision_description", columnDefinition = "text")
    private String revisionDescription;
    
    @Column(name = "previous_revision", length = 20)
    private String previousRevision;
    
    @Column(name = "next_revision", length = 20)
    private String nextRevision;
    
    @Column(name = "change_request_id", columnDefinition = "uuid")
    private UUID changeRequestId;
    
    @Column(name = "change_request_number", length = 50)
    private String changeRequestNumber;
    
    @Column(name = "approved_by", columnDefinition = "uuid")
    private UUID approvedBy;
    
    @Column(name = "approved_by_name", length = 200)
    private String approvedByName;
    
    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;
    
    @Column(name = "effective_date")
    private OffsetDateTime effectiveDate;
    
    @Column(name = "implementation_notes", columnDefinition = "text")
    private String implementationNotes;
    
    @Column(name = "document_references", columnDefinition = "text")
    private String documentReferences;
    
    @Column(name = "material_changes", columnDefinition = "text")
    private String materialChanges;
    
    @Column(name = "process_changes", columnDefinition = "text")
    private String processChanges;
    
    @Column(name = "test_requirements", columnDefinition = "text")
    private String testRequirements;
    
    @Column(name = "cost_impact")
    private Double costImpact;
    
    @Column(name = "schedule_impact")
    private Double scheduleImpact;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RevisionStatus status;
    
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
    
    public OffsetDateTime getRevisionDate() {
        return revisionDate;
    }
    
    public void setRevisionDate(OffsetDateTime revisionDate) {
        this.revisionDate = revisionDate;
    }
    
    public String getRevisionDescription() {
        return revisionDescription;
    }
    
    public void setRevisionDescription(String revisionDescription) {
        this.revisionDescription = revisionDescription;
    }
    
    public String getPreviousRevision() {
        return previousRevision;
    }
    
    public void setPreviousRevision(String previousRevision) {
        this.previousRevision = previousRevision;
    }
    
    public String getNextRevision() {
        return nextRevision;
    }
    
    public void setNextRevision(String nextRevision) {
        this.nextRevision = nextRevision;
    }
    
    public UUID getChangeRequestId() {
        return changeRequestId;
    }
    
    public void setChangeRequestId(UUID changeRequestId) {
        this.changeRequestId = changeRequestId;
    }
    
    public String getChangeRequestNumber() {
        return changeRequestNumber;
    }
    
    public void setChangeRequestNumber(String changeRequestNumber) {
        this.changeRequestNumber = changeRequestNumber;
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
    
    public OffsetDateTime getEffectiveDate() {
        return effectiveDate;
    }
    
    public void setEffectiveDate(OffsetDateTime effectiveDate) {
        this.effectiveDate = effectiveDate;
    }
    
    public String getImplementationNotes() {
        return implementationNotes;
    }
    
    public void setImplementationNotes(String implementationNotes) {
        this.implementationNotes = implementationNotes;
    }
    
    public String getDocumentReferences() {
        return documentReferences;
    }
    
    public void setDocumentReferences(String documentReferences) {
        this.documentReferences = documentReferences;
    }
    
    public String getMaterialChanges() {
        return materialChanges;
    }
    
    public void setMaterialChanges(String materialChanges) {
        this.materialChanges = materialChanges;
    }
    
    public String getProcessChanges() {
        return processChanges;
    }
    
    public void setProcessChanges(String processChanges) {
        this.processChanges = processChanges;
    }
    
    public String getTestRequirements() {
        return testRequirements;
    }
    
    public void setTestRequirements(String testRequirements) {
        this.testRequirements = testRequirements;
    }
    
    public Double getCostImpact() {
        return costImpact;
    }
    
    public void setCostImpact(Double costImpact) {
        this.costImpact = costImpact;
    }
    
    public Double getScheduleImpact() {
        return scheduleImpact;
    }
    
    public void setScheduleImpact(Double scheduleImpact) {
        this.scheduleImpact = scheduleImpact;
    }
    
    public RevisionStatus getStatus() {
        return status;
    }
    
    public void setStatus(RevisionStatus status) {
        this.status = status;
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