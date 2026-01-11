package com.pcbxpress.erp.modules.quality.certificates.dto;

import com.pcbxpress.erp.modules.quality.certificates.model.CoC;
import java.time.LocalDateTime;

public class CoCDto {
    
    private Long id;
    private String cocNo;
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
    private LocalDateTime generatedAt;
    private String sentTo;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public CoCDto() {}
    
    public CoCDto(CoC coc) {
        this.id = coc.getId();
        this.cocNo = coc.getCocNo();
        this.orderNo = coc.getOrderNo();
        this.customer = coc.getCustomer();
        this.poNo = coc.getPoNo();
        this.pcbType = coc.getPcbType();
        this.finish = coc.getFinish();
        this.quantity = coc.getQuantity();
        this.lotNo = coc.getLotNo();
        this.workOrderNo = coc.getWorkOrderNo();
        this.shipmentId = coc.getShipmentId();
        this.carrier = coc.getCarrier();
        this.awb = coc.getAwb();
        this.shipDate = coc.getShipDate();
        this.status = coc.getStatus();
        this.templateId = coc.getTemplateId();
        this.includeTestReports = coc.getIncludeTestReports();
        this.includeAOISummary = coc.getIncludeAOISummary();
        this.includeEtchCoupons = coc.getIncludeEtchCoupons();
        this.notes = coc.getNotes();
        this.generatedBy = coc.getGeneratedBy();
        this.generatedAt = coc.getGeneratedAt();
        this.sentTo = coc.getSentTo();
        this.sentAt = coc.getSentAt();
        this.createdAt = coc.getCreatedAt();
        this.updatedAt = coc.getUpdatedAt();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getCocNo() {
        return cocNo;
    }
    
    public void setCocNo(String cocNo) {
        this.cocNo = cocNo;
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
}