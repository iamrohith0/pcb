package com.pcbxpress.erp.modules.quality.certificates.dto;

import com.pcbxpress.erp.modules.quality.certificates.model.ComplianceDocs;
import java.time.LocalDateTime;

public class ComplianceDocsPayload {
    
    private String orderNo;
    private String customer;
    private String poNo;
    private String pcbType;
    private String finish;
    private Integer quantity;
    private String lotNo;
    private String workOrderNo;
    private String shipmentId;
    private String carrier;
    private String awb;
    private LocalDateTime shipDate;
    private ComplianceDocs.Status status;
    private String templateId;
    private Boolean includeTestReports;
    private Boolean includeAOISummary;
    private Boolean includeEtchCoupons;
    private String notes;
    private String generatedBy;
    private String sentTo;
    
    // Compliance Docs specific fields
    private String documentType;
    private String documentTitle;
    private String documentVersion;
    private LocalDateTime documentDate;
    private String documentAuthor;
    private String documentApprover;
    private LocalDateTime approvalDate;
    private String complianceStandard;
    private String complianceReference;
    private String complianceLevel;
    private String complianceScope;
    private String complianceRequirements;
    private String complianceEvidence;
    private String complianceStatus;
    private LocalDateTime complianceReviewDate;
    private String complianceReviewer;
    private String complianceComments;
    private String documentUrl;
    private String documentPath;
    private String documentSize;
    private String documentFormat;
    private Boolean isPublic;
    private Boolean isArchived;
    private LocalDateTime archiveDate;
    private String archiveReason;
    private String archiveLocation;
    
    // Constructors
    public ComplianceDocsPayload() {}
    
    // Getters and Setters
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
    
    public ComplianceDocs.Status getStatus() {
        return status;
    }
    
    public void setStatus(ComplianceDocs.Status status) {
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
    
    public String getSentTo() {
        return sentTo;
    }
    
    public void setSentTo(String sentTo) {
        this.sentTo = sentTo;
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