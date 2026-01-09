package com.pcbxpress.erp.modules.sales.customer.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "customers", indexes = {
    @Index(name = "idx_customers_code", columnList = "customer_code"),
    @Index(name = "idx_customers_email", columnList = "email"),
    @Index(name = "idx_customers_status", columnList = "status"),
    @Index(name = "idx_customers_company_name", columnList = "company_name"),
    @Index(name = "idx_customers_gstin", columnList = "gstin"),
    @Index(name = "idx_customers_pan", columnList = "pan"),
    @Index(name = "idx_customers_billing_city", columnList = "billing_city"),
    @Index(name = "idx_customers_shipping_city", columnList = "shipping_city"),
    @Index(name = "idx_customers_created_at", columnList = "created_at"),
    @Index(name = "idx_customers_updated_at", columnList = "updated_at")
})
public class Customer {

    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(name = "customer_code", nullable = false, unique = true, length = 50)
    private String customerCode;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(length = 150)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 200)
    private String website;

    @Column(length = 20)
    private String gstin;

    @Column(length = 15)
    private String pan;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "billing_name", length = 150)
    private String billingName;

    @Column(name = "billing_address_line1", length = 200)
    private String billingAddressLine1;

    @Column(name = "billing_address_line2", length = 200)
    private String billingAddressLine2;

    @Column(name = "billing_city", length = 100)
    private String billingCity;

    @Column(name = "billing_state", length = 100)
    private String billingState;

    @Column(name = "billing_pincode", length = 10)
    private String billingPincode;

    @Column(name = "billing_country", length = 50)
    private String billingCountry;

    @Column(name = "billing_gstin", length = 20)
    private String billingGstin;

    @Column(name = "shipping_name", length = 150)
    private String shippingName;

    @Column(name = "shipping_address_line1", length = 200)
    private String shippingAddressLine1;

    @Column(name = "shipping_address_line2", length = 200)
    private String shippingAddressLine2;

    @Column(name = "shipping_city", length = 100)
    private String shippingCity;

    @Column(name = "shipping_state", length = 100)
    private String shippingState;

    @Column(name = "shipping_pincode", length = 10)
    private String shippingPincode;

    @Column(name = "shipping_country", length = 50)
    private String shippingCountry;

    @Column(name = "shipping_gstin", length = 20)
    private String shippingGstin;

    @Column(name = "credit_limit", precision = 15, scale = 2)
    private BigDecimal creditLimit;

    @Column(name = "payment_terms_days")
    private Integer paymentTermsDays;

    @Column(name = "currency", length = 5)
    private String currency;

    @Column(name = "compliance_nda_required", nullable = false)
    private boolean complianceNdaRequired;

    @Column(name = "compliance_ip_sensitive", nullable = false)
    private boolean complianceIpSensitive;

    @Column(name = "compliance_export_restricted", nullable = false)
    private boolean complianceExportRestricted;

    @Column(name = "preferred_finish", length = 50)
    private String preferredFinish;

    @Column(name = "preferred_copper_oz", length = 20)
    private String preferredCopperOz;

    @Column(name = "preferred_solder_mask", length = 50)
    private String preferredSolderMask;

    @Column(name = "preferred_legend", length = 50)
    private String preferredLegend;

    @Column(name = "preferred_packaging", length = 100)
    private String preferredPackaging;

    @Column(name = "preferred_courier", length = 100)
    private String preferredCourier;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

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

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getCustomerCode() {
        return customerCode;
    }

    public void setCustomerCode(String customerCode) {
        this.customerCode = customerCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getGstin() {
        return gstin;
    }

    public void setGstin(String gstin) {
        this.gstin = gstin;
    }

    public String getPan() {
        return pan;
    }

    public void setPan(String pan) {
        this.pan = pan;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getBillingName() {
        return billingName;
    }

    public void setBillingName(String billingName) {
        this.billingName = billingName;
    }

    public String getBillingAddressLine1() {
        return billingAddressLine1;
    }

    public void setBillingAddressLine1(String billingAddressLine1) {
        this.billingAddressLine1 = billingAddressLine1;
    }

    public String getBillingAddressLine2() {
        return billingAddressLine2;
    }

    public void setBillingAddressLine2(String billingAddressLine2) {
        this.billingAddressLine2 = billingAddressLine2;
    }

    public String getBillingCity() {
        return billingCity;
    }

    public void setBillingCity(String billingCity) {
        this.billingCity = billingCity;
    }

    public String getBillingState() {
        return billingState;
    }

    public void setBillingState(String billingState) {
        this.billingState = billingState;
    }

    public String getBillingPincode() {
        return billingPincode;
    }

    public void setBillingPincode(String billingPincode) {
        this.billingPincode = billingPincode;
    }

    public String getBillingCountry() {
        return billingCountry;
    }

    public void setBillingCountry(String billingCountry) {
        this.billingCountry = billingCountry;
    }

    public String getBillingGstin() {
        return billingGstin;
    }

    public void setBillingGstin(String billingGstin) {
        this.billingGstin = billingGstin;
    }

    public String getShippingName() {
        return shippingName;
    }

    public void setShippingName(String shippingName) {
        this.shippingName = shippingName;
    }

    public String getShippingAddressLine1() {
        return shippingAddressLine1;
    }

    public void setShippingAddressLine1(String shippingAddressLine1) {
        this.shippingAddressLine1 = shippingAddressLine1;
    }

    public String getShippingAddressLine2() {
        return shippingAddressLine2;
    }

    public void setShippingAddressLine2(String shippingAddressLine2) {
        this.shippingAddressLine2 = shippingAddressLine2;
    }

    public String getShippingCity() {
        return shippingCity;
    }

    public void setShippingCity(String shippingCity) {
        this.shippingCity = shippingCity;
    }

    public String getShippingState() {
        return shippingState;
    }

    public void setShippingState(String shippingState) {
        this.shippingState = shippingState;
    }

    public String getShippingPincode() {
        return shippingPincode;
    }

    public void setShippingPincode(String shippingPincode) {
        this.shippingPincode = shippingPincode;
    }

    public String getShippingCountry() {
        return shippingCountry;
    }

    public void setShippingCountry(String shippingCountry) {
        this.shippingCountry = shippingCountry;
    }

    public String getShippingGstin() {
        return shippingGstin;
    }

    public void setShippingGstin(String shippingGstin) {
        this.shippingGstin = shippingGstin;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(BigDecimal creditLimit) {
        this.creditLimit = creditLimit;
    }

    public Integer getPaymentTermsDays() {
        return paymentTermsDays;
    }

    public void setPaymentTermsDays(Integer paymentTermsDays) {
        this.paymentTermsDays = paymentTermsDays;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public boolean isComplianceNdaRequired() {
        return complianceNdaRequired;
    }

    public void setComplianceNdaRequired(boolean complianceNdaRequired) {
        this.complianceNdaRequired = complianceNdaRequired;
    }

    public boolean isComplianceIpSensitive() {
        return complianceIpSensitive;
    }

    public void setComplianceIpSensitive(boolean complianceIpSensitive) {
        this.complianceIpSensitive = complianceIpSensitive;
    }

    public boolean isComplianceExportRestricted() {
        return complianceExportRestricted;
    }

    public void setComplianceExportRestricted(boolean complianceExportRestricted) {
        this.complianceExportRestricted = complianceExportRestricted;
    }

    public String getPreferredFinish() {
        return preferredFinish;
    }

    public void setPreferredFinish(String preferredFinish) {
        this.preferredFinish = preferredFinish;
    }

    public String getPreferredCopperOz() {
        return preferredCopperOz;
    }

    public void setPreferredCopperOz(String preferredCopperOz) {
        this.preferredCopperOz = preferredCopperOz;
    }

    public String getPreferredSolderMask() {
        return preferredSolderMask;
    }

    public void setPreferredSolderMask(String preferredSolderMask) {
        this.preferredSolderMask = preferredSolderMask;
    }

    public String getPreferredLegend() {
        return preferredLegend;
    }

    public void setPreferredLegend(String preferredLegend) {
        this.preferredLegend = preferredLegend;
    }

    public String getPreferredPackaging() {
        return preferredPackaging;
    }

    public void setPreferredPackaging(String preferredPackaging) {
        this.preferredPackaging = preferredPackaging;
    }

    public String getPreferredCourier() {
        return preferredCourier;
    }

    public void setPreferredCourier(String preferredCourier) {
        this.preferredCourier = preferredCourier;
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
}
