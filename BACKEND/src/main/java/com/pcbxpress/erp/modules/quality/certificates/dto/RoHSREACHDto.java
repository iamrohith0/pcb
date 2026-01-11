package com.pcbxpress.erp.modules.quality.certificates.dto;

import com.pcbxpress.erp.modules.quality.certificates.model.RoHSREACH;
import java.time.LocalDateTime;

public class RoHSREACHDto {
    
    private Long id;
    private String certificateNo;
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
    private RoHSREACH.Status status;
    private String templateId;
    private Boolean includeTestReports;
    private Boolean includeAOISummary;
    private Boolean includeEtchCoupons;
    private String notes;
    private String generatedBy;
    private LocalDateTime generatedAt;
    private String sentTo;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // RoHS/REACH specific fields
    private String rohsCompliance;
    private String reachCompliance;
    private String restrictedSubstances;
    private LocalDateTime complianceDate;
    private String complianceOfficer;
    private String testLab;
    private String testReportNo;
    private LocalDateTime testDate;
    private String testMethod;
    private String certificateAuthority;
    private String certificateReference;
    private LocalDateTime certificateExpiry;
    
    // Constructors
    public RoHSREACHDto() {}
    
    public RoHSREACHDto(RoHSREACH rohsREACH) {
        this.id = rohsREACH.getId();
        this.certificateNo = rohsREACH.getCertificateNo();
        this.orderNo = rohsREACH.getOrderNo();
        this.customer = rohsREACH.getCustomer();
        this.poNo = rohsREACH.getPoNo();
        this.pcbType = rohsREACH.getPcbType();
        this.finish = rohsREACH.getFinish();
        this.quantity = rohsREACH.getQuantity();
        this.lotNo = rohsREACH.getLotNo();
        this.workOrderNo = rohsREACH.getWorkOrderNo();
        this.shipmentId = rohsREACH.getShipmentId();
        this.carrier = rohsREACH.getCarrier();
        this.awb = rohsREACH.getAwb();
        this.shipDate = rohsREACH.getShipDate();
        this.status = rohsREACH.getStatus();
        this.templateId = rohsREACH.getTemplateId();
        this.includeTestReports = rohsREACH.getIncludeTestReports();
        this.includeAOISummary = rohsREACH.getIncludeAOISummary();
        this.includeEtchCoupons = rohsREACH.getIncludeEtchCoupons();
        this.notes = rohsREACH.getNotes();
        this.generatedBy = rohsREACH.getGeneratedBy();
        this.generatedAt = rohsREACH.getGeneratedAt();
        this.sentTo = rohsREACH.getSentTo();
        this.sentAt = rohsREACH.getSentAt();
        this.createdAt = rohsREACH.getCreatedAt();
        this.updatedAt = rohsREACH.getUpdatedAt();
        
        // RoHS/REACH specific fields
        this.rohsCompliance = rohsREACH.getRohsCompliance();
        this.reachCompliance = rohsREACH.getReachCompliance();
        this.restrictedSubstances = rohsREACH.getRestrictedSubstances();
        this.complianceDate = rohsREACH.getComplianceDate();
        this.complianceOfficer = rohsREACH.getComplianceOfficer();
        this.testLab = rohsREACH.getTestLab();
        this.testReportNo = rohsREACH.getTestReportNo();
        this.testDate = rohsREACH.getTestDate();
        this.testMethod = rohsREACH.getTestMethod();
        this.certificateAuthority = rohsREACH.getCertificateAuthority();
        this.certificateReference = rohsREACH.getCertificateReference();
        this.certificateExpiry = rohsREACH.getCertificateExpiry();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getCertificateNo() {
        return certificateNo;
    }
    
    public void setCertificateNo(String certificateNo) {
        this.certificateNo = certificateNo;
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
    
    public RoHSREACH.Status getStatus() {
        return status;
    }
    
    public void setStatus(RoHSREACH.Status status) {
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
    
    // RoHS/REACH specific getters and setters
    public String getRohsCompliance() {
        return rohsCompliance;
    }
    
    public void setRohsCompliance(String rohsCompliance) {
        this.rohsCompliance = rohsCompliance;
    }
    
    public String getReachCompliance() {
        return reachCompliance;
    }
    
    public void setReachCompliance(String reachCompliance) {
        this.reachCompliance = reachCompliance;
    }
    
    public String getRestrictedSubstances() {
        return restrictedSubstances;
    }
    
    public void setRestrictedSubstances(String restrictedSubstances) {
        this.restrictedSubstances = restrictedSubstances;
    }
    
    public LocalDateTime getComplianceDate() {
        return complianceDate;
    }
    
    public void setComplianceDate(LocalDateTime complianceDate) {
        this.complianceDate = complianceDate;
    }
    
    public String getComplianceOfficer() {
        return complianceOfficer;
    }
    
    public void setComplianceOfficer(String complianceOfficer) {
        this.complianceOfficer = complianceOfficer;
    }
    
    public String getTestLab() {
        return testLab;
    }
    
    public void setTestLab(String testLab) {
        this.testLab = testLab;
    }
    
    public String getTestReportNo() {
        return testReportNo;
    }
    
    public void setTestReportNo(String testReportNo) {
        this.testReportNo = testReportNo;
    }
    
    public LocalDateTime getTestDate() {
        return testDate;
    }
    
    public void setTestDate(LocalDateTime testDate) {
        this.testDate = testDate;
    }
    
    public String getTestMethod() {
        return testMethod;
    }
    
    public void setTestMethod(String testMethod) {
        this.testMethod = testMethod;
    }
    
    public String getCertificateAuthority() {
        return certificateAuthority;
    }
    
    public void setCertificateAuthority(String certificateAuthority) {
        this.certificateAuthority = certificateAuthority;
    }
    
    public String getCertificateReference() {
        return certificateReference;
    }
    
    public void setCertificateReference(String certificateReference) {
        this.certificateReference = certificateReference;
    }
    
    public LocalDateTime getCertificateExpiry() {
        return certificateExpiry;
    }
    
    public void setCertificateExpiry(LocalDateTime certificateExpiry) {
        this.certificateExpiry = certificateExpiry;
    }
}