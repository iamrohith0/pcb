package com.pcbxpress.erp.modules.quality.certificates.dto;

import com.pcbxpress.erp.modules.quality.certificates.model.RoHSREACH;
import java.time.LocalDateTime;

public class RoHSREACHPayload {
    
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
    private String sentTo;
    
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
    public RoHSREACHPayload() {}
    
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
    
    public String getSentTo() {
        return sentTo;
    }
    
    public void setSentTo(String sentTo) {
        this.sentTo = sentTo;
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