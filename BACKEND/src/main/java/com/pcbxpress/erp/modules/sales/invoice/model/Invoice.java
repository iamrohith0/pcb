package com.pcbxpress.erp.modules.sales.invoice.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.CascadeType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.pcbxpress.erp.modules.sales.invoice.model.InvoiceItem;

@Entity
@Table(name = "sales_invoices", indexes = {
    @Index(name = "idx_sales_invoices_invoice_no", columnList = "invoice_no"),
    @Index(name = "idx_sales_invoices_status", columnList = "status"),
    @Index(name = "idx_sales_invoices_customer_id", columnList = "customer_id"),
    @Index(name = "idx_sales_invoices_invoice_date", columnList = "invoice_date"),
    @Index(name = "idx_sales_invoices_created_at", columnList = "created_at"),
    @Index(name = "idx_sales_invoices_updated_at", columnList = "updated_at")
})
public class Invoice {

    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(name = "invoice_no", nullable = false, unique = true, length = 50)
    private String invoiceNo;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "source_type", length = 30)
    private String sourceType;

    @Column(name = "source_order_id")
    private UUID sourceOrderId;

    @Column(length = 10)
    private String currency;

    @Column(name = "place_of_supply", length = 100)
    private String placeOfSupply;

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

    @Column(name = "charges_packing", precision = 15, scale = 2)
    private BigDecimal chargesPacking;

    @Column(name = "charges_shipping", precision = 15, scale = 2)
    private BigDecimal chargesShipping;

    @Column(name = "charges_other", precision = 15, scale = 2)
    private BigDecimal chargesOther;

    @Column(name = "tcs_pct", precision = 6, scale = 2)
    private BigDecimal tcsPct;

    @Column(name = "rounding", precision = 15, scale = 2)
    private BigDecimal rounding;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(columnDefinition = "text")
    private String terms;

    @Column(name = "sub_total", precision = 15, scale = 2)
    private BigDecimal subTotal;

    @Column(name = "discount_total", precision = 15, scale = 2)
    private BigDecimal discountTotal;

    @Column(name = "taxable_total", precision = 15, scale = 2)
    private BigDecimal taxableTotal;

    @Column(name = "tax_total", precision = 15, scale = 2)
    private BigDecimal taxTotal;

    @Column(name = "charge_total", precision = 15, scale = 2)
    private BigDecimal chargeTotal;

    @Column(name = "tcs", precision = 15, scale = 2)
    private BigDecimal tcs;

    @Column(name = "rounding_total", precision = 15, scale = 2)
    private BigDecimal roundingTotal;

    @Column(name = "grand_total", precision = 15, scale = 2)
    private BigDecimal grandTotal;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceItem> items = new ArrayList<>();

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

    // Getters and Setters

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getInvoiceNo() {
        return invoiceNo;
    }

    public void setInvoiceNo(String invoiceNo) {
        this.invoiceNo = invoiceNo;
    }

    public LocalDate getInvoiceDate() {
        return invoiceDate;
    }

    public void setInvoiceDate(LocalDate invoiceDate) {
        this.invoiceDate = invoiceDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UUID getCustomerId() {
        return customerId;
    }

    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }

    public UUID getSourceOrderId() {
        return sourceOrderId;
    }

    public void setSourceOrderId(UUID sourceOrderId) {
        this.sourceOrderId = sourceOrderId;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPlaceOfSupply() {
        return placeOfSupply;
    }

    public void setPlaceOfSupply(String placeOfSupply) {
        this.placeOfSupply = placeOfSupply;
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

    public BigDecimal getChargesPacking() {
        return chargesPacking;
    }

    public void setChargesPacking(BigDecimal chargesPacking) {
        this.chargesPacking = chargesPacking;
    }

    public BigDecimal getChargesShipping() {
        return chargesShipping;
    }

    public void setChargesShipping(BigDecimal chargesShipping) {
        this.chargesShipping = chargesShipping;
    }

    public BigDecimal getChargesOther() {
        return chargesOther;
    }

    public void setChargesOther(BigDecimal chargesOther) {
        this.chargesOther = chargesOther;
    }

    public BigDecimal getTcsPct() {
        return tcsPct;
    }

    public void setTcsPct(BigDecimal tcsPct) {
        this.tcsPct = tcsPct;
    }

    public BigDecimal getRounding() {
        return rounding;
    }

    public void setRounding(BigDecimal rounding) {
        this.rounding = rounding;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getTerms() {
        return terms;
    }

    public void setTerms(String terms) {
        this.terms = terms;
    }

    public BigDecimal getSubTotal() {
        return subTotal;
    }

    public void setSubTotal(BigDecimal subTotal) {
        this.subTotal = subTotal;
    }

    public BigDecimal getDiscountTotal() {
        return discountTotal;
    }

    public void setDiscountTotal(BigDecimal discountTotal) {
        this.discountTotal = discountTotal;
    }

    public BigDecimal getTaxableTotal() {
        return taxableTotal;
    }

    public void setTaxableTotal(BigDecimal taxableTotal) {
        this.taxableTotal = taxableTotal;
    }

    public BigDecimal getTaxTotal() {
        return taxTotal;
    }

    public void setTaxTotal(BigDecimal taxTotal) {
        this.taxTotal = taxTotal;
    }

    public BigDecimal getChargeTotal() {
        return chargeTotal;
    }

    public void setChargeTotal(BigDecimal chargeTotal) {
        this.chargeTotal = chargeTotal;
    }

    public BigDecimal getTcs() {
        return tcs;
    }

    public void setTcs(BigDecimal tcs) {
        this.tcs = tcs;
    }

    public BigDecimal getRoundingTotal() {
        return roundingTotal;
    }

    public void setRoundingTotal(BigDecimal roundingTotal) {
        this.roundingTotal = roundingTotal;
    }

    public BigDecimal getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(BigDecimal grandTotal) {
        this.grandTotal = grandTotal;
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

    public List<InvoiceItem> getItems() {
        return items;
    }

    public void setItems(List<InvoiceItem> items) {
        this.items = items;
    }

    public void addItem(InvoiceItem item) {
        items.add(item);
        item.setInvoice(this);
    }

    public void removeItem(InvoiceItem item) {
        items.remove(item);
        item.setInvoice(null);
    }
}