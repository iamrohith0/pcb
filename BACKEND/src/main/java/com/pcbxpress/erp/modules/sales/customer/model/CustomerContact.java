package com.pcbxpress.erp.modules.sales.customer.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.TableGenerator;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "customer_contacts", indexes = {
    @Index(name = "idx_customer_contacts_customer_id", columnList = "customer_id"),
    @Index(name = "idx_customer_contacts_email", columnList = "email"),
    @Index(name = "idx_customer_contacts_phone", columnList = "phone"),
    @Index(name = "idx_customer_contacts_primary", columnList = "is_primary")
})
public class CustomerContact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 150)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String designation;

    @Column(length = 100)
    private String department;

    @Column(name = "is_primary", nullable = false)
    private boolean isPrimary;

    @Column(name = "is_billing_contact", nullable = false)
    private boolean isBillingContact;

    @Column(name = "is_shipping_contact", nullable = false)
    private boolean isShippingContact;

    @Column(name = "is_technical_contact", nullable = false)
    private boolean isTechnicalContact;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // Constructors
    public CustomerContact() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public CustomerContact(UUID customerId, String name, String email, String phone, 
                          String designation, String department, boolean isPrimary,
                          boolean isBillingContact, boolean isShippingContact, 
                          boolean isTechnicalContact) {
        this();
        this.customerId = customerId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.designation = designation;
        this.department = department;
        this.isPrimary = isPrimary;
        this.isBillingContact = isBillingContact;
        this.isShippingContact = isShippingContact;
        this.isTechnicalContact = isTechnicalContact;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public boolean isPrimary() {
        return isPrimary;
    }

    public void setPrimary(boolean primary) {
        isPrimary = primary;
    }

    public boolean isBillingContact() {
        return isBillingContact;
    }

    public void setBillingContact(boolean billingContact) {
        isBillingContact = billingContact;
    }

    public boolean isShippingContact() {
        return isShippingContact;
    }

    public void setShippingContact(boolean shippingContact) {
        isShippingContact = shippingContact;
    }

    public boolean isTechnicalContact() {
        return isTechnicalContact;
    }

    public void setTechnicalContact(boolean technicalContact) {
        isTechnicalContact = technicalContact;
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