package com.pcbxpress.erp.modules.quality.capa.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "capa")
public class CAPA {
    
    @Id
    @GeneratedValue(generator = "uuid2")
    @org.hibernate.annotations.GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;
    
    @Column(unique = true)
    private String capaNo;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SourceType sourceType;
    
    @Column
    private String referenceNo;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @Column(length = 2000)
    private String problemStatement;
    
    @Column
    private String affectedProcess;
    
    @Column
    private String partNo;
    
    @Column
    private String jobNo;
    
    @Column
    private String lotNo;
    
    @Column(length = 1000)
    private String containmentAction;
    
    @Enumerated(EnumType.STRING)
    @Column
    private RootCauseMethod rootCauseMethod;
    
    @Column(length = 2000)
    private String rootCause;
    
    @Column(length = 2000)
    private String correctiveAction;
    
    @Column(length = 2000)
    private String preventiveAction;
    
    @Column(nullable = false)
    private String ownerName;
    
    @Column
    private String ownerDepartment;
    
    @Column(nullable = false)
    private LocalDateTime dueDate;
    
    @Column(length = 1000)
    private String effectivenessCriteria;
    
    @Column(length = 1000)
    private String notes;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime updatedAt;
    
    @Column
    private String createdBy;
    
    public enum SourceType {
        NCR, AOI, ETEST, INCOMING_QC, INPROCESS_QC, FINAL_QC, CUSTOMER_COMPLAINT, AUDIT
    }
    
    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
    
    public enum Status {
        DRAFT, OPEN, IN_PROGRESS, VERIFIED, CLOSED, REJECTED
    }
    
    public enum RootCauseMethod {
        FIVE_WHY, FISHBONE, EIGHT_D, OTHER
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getCapaNo() {
        return capaNo;
    }
    
    public void setCapaNo(String capaNo) {
        this.capaNo = capaNo;
    }
    
    public SourceType getSourceType() {
        return sourceType;
    }
    
    public void setSourceType(SourceType sourceType) {
        this.sourceType = sourceType;
    }
    
    public String getReferenceNo() {
        return referenceNo;
    }
    
    public void setReferenceNo(String referenceNo) {
        this.referenceNo = referenceNo;
    }
    
    public Severity getSeverity() {
        return severity;
    }
    
    public void setSeverity(Severity severity) {
        this.severity = severity;
    }
    
    public Status getStatus() {
        return status;
    }
    
    public void setStatus(Status status) {
        this.status = status;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getProblemStatement() {
        return problemStatement;
    }
    
    public void setProblemStatement(String problemStatement) {
        this.problemStatement = problemStatement;
    }
    
    public String getAffectedProcess() {
        return affectedProcess;
    }
    
    public void setAffectedProcess(String affectedProcess) {
        this.affectedProcess = affectedProcess;
    }
    
    public String getPartNo() {
        return partNo;
    }
    
    public void setPartNo(String partNo) {
        this.partNo = partNo;
    }
    
    public String getJobNo() {
        return jobNo;
    }
    
    public void setJobNo(String jobNo) {
        this.jobNo = jobNo;
    }
    
    public String getLotNo() {
        return lotNo;
    }
    
    public void setLotNo(String lotNo) {
        this.lotNo = lotNo;
    }
    
    public String getContainmentAction() {
        return containmentAction;
    }
    
    public void setContainmentAction(String containmentAction) {
        this.containmentAction = containmentAction;
    }
    
    public RootCauseMethod getRootCauseMethod() {
        return rootCauseMethod;
    }
    
    public void setRootCauseMethod(RootCauseMethod rootCauseMethod) {
        this.rootCauseMethod = rootCauseMethod;
    }
    
    public String getRootCause() {
        return rootCause;
    }
    
    public void setRootCause(String rootCause) {
        this.rootCause = rootCause;
    }
    
    public String getCorrectiveAction() {
        return correctiveAction;
    }
    
    public void setCorrectiveAction(String correctiveAction) {
        this.correctiveAction = correctiveAction;
    }
    
    public String getPreventiveAction() {
        return preventiveAction;
    }
    
    public void setPreventiveAction(String preventiveAction) {
        this.preventiveAction = preventiveAction;
    }
    
    public String getOwnerName() {
        return ownerName;
    }
    
    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }
    
    public String getOwnerDepartment() {
        return ownerDepartment;
    }
    
    public void setOwnerDepartment(String ownerDepartment) {
        this.ownerDepartment = ownerDepartment;
    }
    
    public LocalDateTime getDueDate() {
        return dueDate;
    }
    
    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }
    
    public String getEffectivenessCriteria() {
        return effectivenessCriteria;
    }
    
    public void setEffectivenessCriteria(String effectivenessCriteria) {
        this.effectivenessCriteria = effectivenessCriteria;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}