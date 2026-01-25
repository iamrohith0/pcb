package com.pcbxpress.erp.modules.sales.rfq.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "sales_rfq_lines", schema = "public")
public class RfqLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "rfq_id", nullable = false)
    private Rfq rfq;

    @Column(name = "line_no")
    private Integer lineNo;

    @Column(name = "pcb_type", length = 50)
    private String pcbType;

    @Column(name = "layers")
    private Integer layers;

    @Column(name = "thickness_mm", precision = 6, scale = 3)
    private BigDecimal thicknessMm;

    @Column(name = "copper_oz", precision = 6, scale = 3)
    private BigDecimal copperOz;

    @Column(name = "finish", length = 50)
    private String finish;

    @Column(name = "solder_mask", length = 50)
    private String solderMask;

    @Column(name = "silkscreen", length = 50)
    private String silkscreen;

    @Column(name = "panelization", length = 50)
    private String panelization;

    @Column(name = "qty")
    private Integer qty;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "delivery_days")
    private Integer deliveryDays;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @Column(name = "created_at", columnDefinition = "timestamptz", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", columnDefinition = "timestamptz", insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    // --- getters/setters ---
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Rfq getRfq() { return rfq; }
    public void setRfq(Rfq rfq) { this.rfq = rfq; }

    public Integer getLineNo() { return lineNo; }
    public void setLineNo(Integer lineNo) { this.lineNo = lineNo; }

    public String getPcbType() { return pcbType; }
    public void setPcbType(String pcbType) { this.pcbType = pcbType; }

    public Integer getLayers() { return layers; }
    public void setLayers(Integer layers) { this.layers = layers; }

    public BigDecimal getThicknessMm() { return thicknessMm; }
    public void setThicknessMm(BigDecimal thicknessMm) { this.thicknessMm = thicknessMm; }

    public BigDecimal getCopperOz() { return copperOz; }
    public void setCopperOz(BigDecimal copperOz) { this.copperOz = copperOz; }

    public String getFinish() { return finish; }
    public void setFinish(String finish) { this.finish = finish; }

    public String getSolderMask() { return solderMask; }
    public void setSolderMask(String solderMask) { this.solderMask = solderMask; }

    public String getSilkscreen() { return silkscreen; }
    public void setSilkscreen(String silkscreen) { this.silkscreen = silkscreen; }

    public String getPanelization() { return panelization; }
    public void setPanelization(String panelization) { this.panelization = panelization; }

    public Integer getQty() { return qty; }
    public void setQty(Integer qty) { this.qty = qty; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Integer getDeliveryDays() { return deliveryDays; }
    public void setDeliveryDays(Integer deliveryDays) { this.deliveryDays = deliveryDays; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
