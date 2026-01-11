package com.pcbxpress.erp.modules.quality.certificates.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates_compliance_docs")
public class ComplianceDocs {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String documentNo;
    
    @Column(nullable = false)
    private String orderNo;
    
    @Column
    private String customer;
    
    @Column
    private String poNo;
    
    @Column
    private String pcbType;
    
    @Column
    private String finish;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column
    private String lotNo;
    
    @Column
    private String workOrderNo;
    
    @Column
    private String shipmentId;
    
    @Column
    private String carrier;
    
    @Column
    private String awb;
    
    @Column
    private LocalDateTime shipDate;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;
    
    @Column
    private String templateId;
    
    @Column
    private Boolean includeTestReports;
    
    @Column
    private Boolean includeAOISummary;
    
    @Column
    private Boolean includeEtchCoupons;
    
    @Column(length = 1000)
    private String notes;
    
    @Column
    private String generatedBy;
    
    @Column
    private LocalDateTime generatedAt;
    
    @Column
    private String sentTo;
    
    @Column
    private LocalDateTime sentAt;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime updatedAt;
    
    // Compliance Docs specific fields
    @Column
    private String documentType;
    
    @Column
    private String documentTitle;
    
    @Column
    private String documentVersion;
    
    @Column
    private LocalDateTime documentDate;
    
    @Column
    private String documentAuthor;
    
    @Column
    private String documentApprover;
    
    @Column
    private LocalDateTime approvalDate;
    
    @Column
    private String complianceStandard;
    
    @Column
    private String complianceReference;
    
    @Column
    private String complianceLevel;
    
    @Column
    private String complianceScope;
    
    @Column
    private String complianceRequirements;
    
    @Column
    private String complianceEvidence;
    
    @Column
    private String complianceStatus;
    
    @Column
    private LocalDateTime complianceReviewDate;
    
    @Column
    private String complianceReviewer;
    
    @Column
    private String complianceComments;
    
    @Column
    private String documentUrl;
    
    @Column
    private String documentPath;
    
    @Column
    private String documentSize;
    
    @Column
    private String documentFormat;
    
    @Column
    private Boolean isPublic;
    
    @Column
    private Boolean isArchived;
    
    @Column
    private LocalDateTime archiveDate;
    
    @Column
    private String archiveReason;
    
    @Column
    private String archiveLocation;
    
    public enum Status {
        DRAFT, READY, SENT, CANCELLED, ARCHIVED
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
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getDocumentNo() {
        return documentNo;
    }
    
    public void setDocumentNo(String documentNo) {
        this.documentNo = documentNo;
    }
    
    public String getOrderNo() {
        return orderNo;
    }
    
    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }
    
    public String getCustomer() {
        return customer;
    }
    
    public void setCustomer(String customer) {
        this.customer = customer;
    }
    
    public String getPoNo() {
        return poNo;
    }
    
    public void setPoNo(String poNo) {
        this.poNo = poNo;
    }
    
    public String getPcbType() {
        return pcbType;
    }
    
    public void setPcbType(String pcbType) {
        this.pcbType = pcbType;
    }
    
    public String getFinish() {
        return finish;
    }
    
    public void setFinish(String finish) {
        this.finish = finish;
    }
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
    
    public String getLotNo() {
        return lotNo;
    }
    
    public void setLotNo(String lotNo) {
        this.lotNo = lotNo;
    }
    
    public String getWorkOrderNo() {
        return workOrderNo;
    }
    
    public void setWorkOrderNo(String workOrderNo) {
        this.workOrderNo = workOrderNo;
    }
    
    public String getShipmentId() {
        return shipmentId;
    }
    
    public void setShipmentId(String shipmentId) {
        this.shipmentId = shipmentId;
    }
    
    public String getCarrier() {
        return carrier;
    }
    
    public void setCarrier(String carrier) {
        this.carrier = carrier;
    }
    
    public String getAwb() {
        return awb;
    }
    
    public void setAwb(String awb) {
        this.awb = awb;
    }
    
    public LocalDateTime getShipDate() {
        return shipDate;
    }
    
    public void setShipDate(LocalDateTime shipDate) {
        this.shipDate = shipDate;
    }
    
    public Status getStatus() {
        return status;
    }
    
    public void setStatus(Status status) {
        this.status = status;
    }
    
    public String getTemplateId() {
        return templateId;
    }
    
    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }
    
    public Boolean getIncludeTestReports() {
        return includeTestReports;
    }
    
    public void setIncludeTestReports(Boolean includeTestReports) {
        this.includeTestReports = includeTestReports;
    }
    
    public Boolean getIncludeAOISummary() {
        return includeAOISummary;
    }
    
    public void setIncludeAOISummary(Boolean includeAOISummary) {
        this.includeAOISummary = includeAOISummary;
    }
    
    public Boolean getIncludeEtchCoupons() {
        return includeEtchCoupons;
    }
    
    public void setIncludeEtchCoupons(Boolean includeEtchCoupons) {
        this.includeEtchCoupons = includeEtchCoupons;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public String getGeneratedBy() {
        return generatedBy;
    }
    
    public void setGeneratedBy(String generatedBy) {
        this.generatedBy = generatedBy;
    }
    
    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }
    
    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
    
    public String getSentTo() {
        return sentTo;
    }
    
    public void setSentTo(String sentTo) {
        this.sentTo = sentTo;
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
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
    
    // Compliance Docs specific getters and setters
    public String getDocumentType() {
        return documentType;
    }
    
    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }
    
    public String getDocumentTitle() {
        return documentTitle;
    }
    
    public void setDocumentTitle(String documentTitle) {
        this.documentTitle = documentTitle;
    }
    
    public String getDocumentVersion() {
        return documentVersion;
    }
    
    public void setDocumentVersion(String documentVersion) {
        this.documentVersion = documentVersion;
    }
    
    public LocalDateTime getDocumentDate() {
        return documentDate;
    }
    
    public void setDocumentDate(LocalDateTime documentDate) {
        this.documentDate = documentDate;
    }
    
    public String getDocumentAuthor() {
        return documentAuthor;
    }
    
    public void setDocumentAuthor(String documentAuthor) {
        this.documentAuthor = documentAuthor;
    }
    
    public String getDocumentApprover() {
        return documentApprover;
    }
    
    public void setDocumentApprover(String documentApprover) {
        this.documentApprover = documentApprover;
    }
    
    public LocalDateTime getApprovalDate() {
        return approvalDate;
    }
    
    public void setApprovalDate(LocalDateTime approvalDate) {
        this.approvalDate = approvalDate;
    }
    
    public String getComplianceStandard() {
        return complianceStandard;
    }
    
    public void setComplianceStandard(String complianceStandard) {
        this.complianceStandard = complianceStandard;
    }
    
    public String getComplianceReference() {
        return complianceReference;
    }
    
    public void setComplianceReference(String complianceReference) {
        this.complianceReference = complianceReference;
    }
    
    public String getComplianceLevel() {
        return complianceLevel;
    }
    
    public void setComplianceLevel(String complianceLevel) {
        this.complianceLevel = complianceLevel;
    }
    
    public String getComplianceScope() {
        return complianceScope;
    }
    
    public void setComplianceScope(String complianceScope) {
        this.complianceScope = complianceScope;
    }
    
    public String getComplianceRequirements() {
        return complianceRequirements;
    }
    
    public void setComplianceRequirements(String complianceRequirements) {
        this.complianceRequirements = complianceRequirements;
    }
    
    public String getComplianceEvidence() {
        return complianceEvidence;
    }
    
    public void setComplianceEvidence(String complianceEvidence) {
        this.complianceEvidence = complianceEvidence;
    }
    
    public String getComplianceStatus() {
        return complianceStatus;
    }
    
    public void setComplianceStatus(String complianceStatus) {
        this.complianceStatus = complianceStatus;
    }
    
    public LocalDateTime getComplianceReviewDate() {
        return complianceReviewDate;
    }
    
    public void setComplianceReviewDate(LocalDateTime complianceReviewDate) {
        this.complianceReviewDate = complianceReviewDate;
    }
    
    public String getComplianceReviewer() {
        return complianceReviewer;
    }
    
    public void setComplianceReviewer(String complianceReviewer) {
        this.complianceReviewer = complianceReviewer;
    }
    
    public String getComplianceComments() {
        return complianceComments;
    }
    
    public void setComplianceComments(String complianceComments) {
        this.complianceComments = complianceComments;
    }
    
    public String getDocumentUrl() {
        return documentUrl;
    }
    
    public void setDocumentUrl(String documentUrl) {
        this.documentUrl = documentUrl;
    }
    
    public String getDocumentPath() {
        return documentPath;
    }
    
    public void setDocumentPath(String documentPath) {
        this.documentPath = documentPath;
    }
    
    public String getDocumentSize() {
        return documentSize;
    }
    
    public void setDocumentSize(String documentSize) {
        this.documentSize = documentSize;
    }
    
    public String getDocumentFormat() {
        return documentFormat;
    }
    
    public void setDocumentFormat(String documentFormat) {
        this.documentFormat = documentFormat;
    }
    
    public Boolean getIsPublic() {
        return isPublic;
    }
    
    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }
    
    public Boolean getIsArchived() {
        return isArchived;
    }
    
    public void setIsArchived(Boolean isArchived) {
        this.isArchived = isArchived;
    }
    
    public LocalDateTime getArchiveDate() {
        return archiveDate;
    }
    
    public void setArchiveDate(LocalDateTime archiveDate) {
        this.archiveDate = archiveDate;
    }
    
    public String getArchiveReason() {
        return archiveReason;
    }
    
    public void setArchiveReason(String archiveReason) {
        this.archiveReason = archiveReason;
    }
    
    public String getArchiveLocation() {
        return archiveLocation;
    }
    
    public void setArchiveLocation(String archiveLocation) {
        this.archiveLocation = archiveLocation;
    }
}