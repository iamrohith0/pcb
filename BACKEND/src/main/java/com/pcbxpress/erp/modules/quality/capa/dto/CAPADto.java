package com.pcbxpress.erp.modules.quality.capa.dto;

import com.pcbxpress.erp.modules.quality.capa.model.CAPA;
import java.time.LocalDateTime;
import java.util.UUID;

public class CAPADto {
    
    private UUID id;
    private String capaNo;
    private String sourceType;
    private String referenceNo;
    private String severity;
    private String status;
    private String title;
    private String problemStatement;
    private String affectedProcess;
    private String partNo;
    private String jobNo;
    private String lotNo;
    private String containmentAction;
    private String rootCauseMethod;
    private String rootCause;
    private String correctiveAction;
    private String preventiveAction;
    private String ownerName;
    private String ownerDepartment;
    private LocalDateTime dueDate;
    private String effectivenessCriteria;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String createdByName;
    
    public CAPADto() {}
    
    public CAPADto(CAPA capa) {
        this.id = capa.getId();
        this.capaNo = capa.getCapaNo();
        this.sourceType = capa.getSourceType() != null ? capa.getSourceType().name() : null;
        this.referenceNo = capa.getReferenceNo();
        this.severity = capa.getSeverity() != null ? capa.getSeverity().name() : null;
        this.status = capa.getStatus() != null ? capa.getStatus().name() : null;
        this.title = capa.getTitle();
        this.problemStatement = capa.getProblemStatement();
        this.affectedProcess = capa.getAffectedProcess();
        this.partNo = capa.getPartNo();
        this.jobNo = capa.getJobNo();
        this.lotNo = capa.getLotNo();
        this.containmentAction = capa.getContainmentAction();
        this.rootCauseMethod = capa.getRootCauseMethod() != null ? capa.getRootCauseMethod().name() : null;
        this.rootCause = capa.getRootCause();
        this.correctiveAction = capa.getCorrectiveAction();
        this.preventiveAction = capa.getPreventiveAction();
        this.ownerName = capa.getOwnerName();
        this.ownerDepartment = capa.getOwnerDepartment();
        this.dueDate = capa.getDueDate();
        this.effectivenessCriteria = capa.getEffectivenessCriteria();
        this.notes = capa.getNotes();
        this.createdAt = capa.getCreatedAt();
        this.updatedAt = capa.getUpdatedAt();
        this.createdBy = capa.getCreatedBy();
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
    
    public String getSourceType() {
        return sourceType;
    }
    
    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }
    
    public String getReferenceNo() {
        return referenceNo;
    }
    
    public void setReferenceNo(String referenceNo) {
        this.referenceNo = referenceNo;
    }
    
    public String getSeverity() {
        return severity;
    }
    
    public void setSeverity(String severity) {
        this.severity = severity;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
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
    
    public String getRootCauseMethod() {
        return rootCauseMethod;
    }
    
    public void setRootCauseMethod(String rootCauseMethod) {
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
    
    public String getCreatedByName() {
        return createdByName;
    }
    
    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }
}