package com.pcbxpress.erp.modules.sales.quotation.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sales_quotations", schema = "public")
public class Quotation {

    @Id
    @GeneratedValue
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "quote_no", nullable = false, length = 50, unique = true)
    private String quoteNo;

    @Column(name = "quote_date", nullable = false)
    private LocalDate quoteDate;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "currency", nullable = false, length = 10)
    private String currency;

    @Column(name = "incoterms", length = 50)
    private String incoterms;

    @Column(name = "lead_time", length = 100)
    private String leadTime;

    @Column(name = "payment_terms", length = 100)
    private String paymentTerms;

    @Column(name = "remarks", columnDefinition = "text")
    private String remarks;

    @Column(name = "rfq_id", columnDefinition = "uuid")
    private UUID rfqId;

    @Column(name = "rfq_ref", length = 50)
    private String rfqRef;

    @Column(name = "customer_id", columnDefinition = "uuid")
    private UUID customerId;

    @Column(name = "internal_note", columnDefinition = "text")
    private String internalNote;

    // PCB Spec (flattened columns)
    @Column(name = "pcb_job_name", length = 150)
    private String pcbJobName;

    @Column(name = "pcb_board_type", length = 50)
    private String pcbBoardType;

    @Column(name = "pcb_layer_count")
    private Integer pcbLayerCount;

    @Column(name = "pcb_thickness", length = 50)
    private String pcbThickness;

    @Column(name = "pcb_copper_weight", length = 50)
    private String pcbCopperWeight;

    @Column(name = "pcb_surface_finish", length = 50)
    private String pcbSurfaceFinish;

    @Column(name = "pcb_solder_mask", length = 50)
    private String pcbSolderMask;

    @Column(name = "pcb_silkscreen", length = 50)
    private String pcbSilkscreen;

    @Column(name = "pcb_impedance_control", length = 50)
    private String pcbImpedanceControl;

    @Column(name = "pcb_via_type", length = 50)
    private String pcbViaType;

    @Column(name = "pcb_panelization", length = 50)
    private String pcbPanelization;

    // Totals
    @Column(name = "sub_total", precision = 15, scale = 2)
    private BigDecimal subTotal;

    @Column(name = "discount_total", precision = 15, scale = 2)
    private BigDecimal discountTotal;

    @Column(name = "tax_total", precision = 15, scale = 2)
    private BigDecimal taxTotal;

    @Column(name = "grand_total", precision = 15, scale = 2)
    private BigDecimal grandTotal;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<QuotationLine> lines = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null || status.isBlank()) status = "Draft";
        if (currency == null || currency.isBlank()) currency = "INR";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    // ---------- Helpers ----------
    public void setLines(List<QuotationLine> newLines) {
        this.lines.clear();
        if (newLines != null) {
            for (QuotationLine l : newLines) {
                addLine(l);
            }
        }
    }

    public void addLine(QuotationLine line) {
        line.setQuotation(this);
        this.lines.add(line);
    }

    // ---------- Getters/Setters ----------
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getQuoteNo() { return quoteNo; }
    public void setQuoteNo(String quoteNo) { this.quoteNo = quoteNo; }

    public LocalDate getQuoteDate() { return quoteDate; }
    public void setQuoteDate(LocalDate quoteDate) { this.quoteDate = quoteDate; }

    public LocalDate getValidUntil() { return validUntil; }
    public void setValidUntil(LocalDate validUntil) { this.validUntil = validUntil; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getIncoterms() { return incoterms; }
    public void setIncoterms(String incoterms) { this.incoterms = incoterms; }

    public String getLeadTime() { return leadTime; }
    public void setLeadTime(String leadTime) { this.leadTime = leadTime; }

    public String getPaymentTerms() { return paymentTerms; }
    public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public UUID getRfqId() { return rfqId; }
    public void setRfqId(UUID rfqId) { this.rfqId = rfqId; }

    public String getRfqRef() { return rfqRef; }
    public void setRfqRef(String rfqRef) { this.rfqRef = rfqRef; }

    public UUID getCustomerId() { return customerId; }
    public void setCustomerId(UUID customerId) { this.customerId = customerId; }

    public String getInternalNote() { return internalNote; }
    public void setInternalNote(String internalNote) { this.internalNote = internalNote; }

    public String getPcbJobName() { return pcbJobName; }
    public void setPcbJobName(String pcbJobName) { this.pcbJobName = pcbJobName; }

    public String getPcbBoardType() { return pcbBoardType; }
    public void setPcbBoardType(String pcbBoardType) { this.pcbBoardType = pcbBoardType; }

    public Integer getPcbLayerCount() { return pcbLayerCount; }
    public void setPcbLayerCount(Integer pcbLayerCount) { this.pcbLayerCount = pcbLayerCount; }

    public String getPcbThickness() { return pcbThickness; }
    public void setPcbThickness(String pcbThickness) { this.pcbThickness = pcbThickness; }

    public String getPcbCopperWeight() { return pcbCopperWeight; }
    public void setPcbCopperWeight(String pcbCopperWeight) { this.pcbCopperWeight = pcbCopperWeight; }

    public String getPcbSurfaceFinish() { return pcbSurfaceFinish; }
    public void setPcbSurfaceFinish(String pcbSurfaceFinish) { this.pcbSurfaceFinish = pcbSurfaceFinish; }

    public String getPcbSolderMask() { return pcbSolderMask; }
    public void setPcbSolderMask(String pcbSolderMask) { this.pcbSolderMask = pcbSolderMask; }

    public String getPcbSilkscreen() { return pcbSilkscreen; }
    public void setPcbSilkscreen(String pcbSilkscreen) { this.pcbSilkscreen = pcbSilkscreen; }

    public String getPcbImpedanceControl() { return pcbImpedanceControl; }
    public void setPcbImpedanceControl(String pcbImpedanceControl) { this.pcbImpedanceControl = pcbImpedanceControl; }

    public String getPcbViaType() { return pcbViaType; }
    public void setPcbViaType(String pcbViaType) { this.pcbViaType = pcbViaType; }

    public String getPcbPanelization() { return pcbPanelization; }
    public void setPcbPanelization(String pcbPanelization) { this.pcbPanelization = pcbPanelization; }

    public BigDecimal getSubTotal() { return subTotal; }
    public void setSubTotal(BigDecimal subTotal) { this.subTotal = subTotal; }

    public BigDecimal getDiscountTotal() { return discountTotal; }
    public void setDiscountTotal(BigDecimal discountTotal) { this.discountTotal = discountTotal; }

    public BigDecimal getTaxTotal() { return taxTotal; }
    public void setTaxTotal(BigDecimal taxTotal) { this.taxTotal = taxTotal; }

    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<QuotationLine> getLines() { return lines; }
}
