package com.pcbxpress.erp.modules.quality.certificates.dto;

import com.pcbxpress.erp.modules.quality.certificates.model.CoC;
import java.time.LocalDateTime;

public class CoCPayload {
    
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
    private CoC.Status status;
    private String templateId;
    private Boolean includeTestReports;
    private Boolean includeAOISummary;
    private Boolean includeEtchCoupons;
    private String notes;
    private String generatedBy;
    private String sentTo;
    
    // Constructors
    public CoCPayload() {}
    
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
    
    public CoC.Status getStatus() {
        return status;
    }
    
    public void setStatus(CoC.Status status) {
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
}