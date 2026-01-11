package com.pcbxpress.erp.modules.quality.certificates.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates_rohs_reach")
public class RoHSREACH {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String certificateNo;
    
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
    
    // RoHS/REACH specific fields
    @Column
    private String rohsCompliance;
    
    @Column
    private String reachCompliance;
    
    @Column
    private String restrictedSubstances;
    
    @Column
    private LocalDateTime complianceDate;
    
    @Column
    private String complianceOfficer;
    
    @Column
    private String testLab;
    
    @Column
    private String testReportNo;
    
    @Column
    private LocalDateTime testDate;
    
    @Column
    private String testMethod;
    
    @Column
    private String certificateAuthority;
    
    @Column
    private String certificateReference;
    
    @Column
    private LocalDateTime certificateExpiry;
    
    public enum Status {
        DRAFT, READY, SENT, CANCELLED
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