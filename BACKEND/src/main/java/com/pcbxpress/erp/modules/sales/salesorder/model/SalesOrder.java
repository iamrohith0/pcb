package com.pcbxpress.erp.modules.sales.salesorder.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.pcbxpress.erp.common.jpa.JsonbStringListConverter;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "sales_orders", schema = "public")
public class SalesOrder {

    @Id
    @GeneratedValue
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "order_no", nullable = false, length = 50, unique = true)
    private String orderNo;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "Draft";

    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "INR";

    @Column(name = "customer_id", columnDefinition = "uuid")
    private UUID customerId;

    // Contact
    @Column(name = "contact_name", length = 150)
    private String contactName;

    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    @Column(name = "contact_email", length = 150)
    private String contactEmail;

    // PO
    @Column(name = "po_number", length = 50)
    private String poNumber;

    @Column(name = "po_date")
    private LocalDate poDate;

    // Job
    @Column(name = "job_name", length = 150)
    private String jobName;

    @Column(name = "job_priority", length = 30)
    private String jobPriority;

    @Column(name = "requested_delivery")
    private LocalDate requestedDelivery;

    // Shipping
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
    private String shippingCountry = "India";

    @Column(name = "shipping_gstin", length = 20)
    private String shippingGstin;

    // Billing
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
    private String billingCountry = "India";

    @Column(name = "billing_gstin", length = 20)
    private String billingGstin;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    /**
     * ✅ FIX: jsonb column binding
     * Hibernate will bind it as JSON (not VARCHAR) so Postgres accepts jsonb.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Convert(converter = JsonbStringListConverter.class)
    @Column(name = "attachments", nullable = false, columnDefinition = "jsonb")
    private List<String> attachments = new ArrayList<>();

    @Column(name = "sub_total", precision = 15, scale = 2)
    private BigDecimal subTotal;

    @Column(name = "tax_total", precision = 15, scale = 2)
    private BigDecimal taxTotal;

    @Column(name = "grand_total", precision = 15, scale = 2)
    private BigDecimal grandTotal;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SalesOrderItem> items = new ArrayList<>();

    @PrePersist
    void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null) status = "Draft";
        if (currency == null) currency = "INR";
        if (attachments == null) attachments = new ArrayList<>();
        if (items == null) items = new ArrayList<>();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
        if (attachments == null) attachments = new ArrayList<>();
    }

    public void setItemsWithBackRef(List<SalesOrderItem> newItems) {
        this.items.clear();
        if (newItems != null) {
            for (SalesOrderItem it : newItems) {
                it.setOrder(this);
                this.items.add(it);
            }
        }
    }
}
