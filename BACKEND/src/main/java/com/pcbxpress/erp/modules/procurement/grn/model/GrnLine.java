package com.pcbxpress.erp.modules.procurement.grn.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "grn_lines")
public class GrnLine {

    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_id", nullable = false)
    private Grn grn;

    @Column(name = "po_line_id", nullable = false)
    private UUID poLineId;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "item_code", length = 50)
    private String itemCode;

    @Column(name = "item_description", columnDefinition = "text")
    private String itemDescription;

    @Column(name = "po_quantity", precision = 15, scale = 4)
    private BigDecimal poQuantity;

    @Column(name = "received_quantity", precision = 15, scale = 4)
    private BigDecimal receivedQuantity;

    @Column(name = "accepted_quantity", precision = 15, scale = 4)
    private BigDecimal acceptedQuantity;

    @Column(name = "rejected_quantity", precision = 15, scale = 4)
    private BigDecimal rejectedQuantity;

    @Column(name = "unit_price", precision = 15, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "line_value", precision = 15, scale = 2)
    private BigDecimal lineValue;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(name = "expiry_date")
    private OffsetDateTime expiryDate;

    @Column(name = "qc_status", length = 30)
    private String qcStatus;

    @Column(name = "qc_remarks", columnDefinition = "text")
    private String qcRemarks;

    @Column(name = "putaway_location", length = 100)
    private String putawayLocation;

    @Column(name = "putaway_completed_at")
    private OffsetDateTime putawayCompletedAt;

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
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (qcStatus == null || qcStatus.isBlank()) {
            qcStatus = "PENDING";
        }
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

    public Grn getGrn() {
        return grn;
    }

    public void setGrn(Grn grn) {
        this.grn = grn;
    }

    public UUID getPoLineId() {
        return poLineId;
    }

    public void setPoLineId(UUID poLineId) {
        this.poLineId = poLineId;
    }

    public UUID getItemId() {
        return itemId;
    }

    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public String getItemDescription() {
        return itemDescription;
    }

    public void setItemDescription(String itemDescription) {
        this.itemDescription = itemDescription;
    }

    public BigDecimal getPoQuantity() {
        return poQuantity;
    }

    public void setPoQuantity(BigDecimal poQuantity) {
        this.poQuantity = poQuantity;
    }

    public BigDecimal getReceivedQuantity() {
        return receivedQuantity;
    }

    public void setReceivedQuantity(BigDecimal receivedQuantity) {
        this.receivedQuantity = receivedQuantity;
    }

    public BigDecimal getAcceptedQuantity() {
        return acceptedQuantity;
    }

    public void setAcceptedQuantity(BigDecimal acceptedQuantity) {
        this.acceptedQuantity = acceptedQuantity;
    }

    public BigDecimal getRejectedQuantity() {
        return rejectedQuantity;
    }

    public void setRejectedQuantity(BigDecimal rejectedQuantity) {
        this.rejectedQuantity = rejectedQuantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getLineValue() {
        return lineValue;
    }

    public void setLineValue(BigDecimal lineValue) {
        this.lineValue = lineValue;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public void setBatchNumber(String batchNumber) {
        this.batchNumber = batchNumber;
    }

    public OffsetDateTime getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(OffsetDateTime expiryDate) {
        this.expiryDate = expiryDate;
    }

    public String getQcStatus() {
        return qcStatus;
    }

    public void setQcStatus(String qcStatus) {
        this.qcStatus = qcStatus;
    }

    public String getQcRemarks() {
        return qcRemarks;
    }

    public void setQcRemarks(String qcRemarks) {
        this.qcRemarks = qcRemarks;
    }

    public String getPutawayLocation() {
        return putawayLocation;
    }

    public void setPutawayLocation(String putawayLocation) {
        this.putawayLocation = putawayLocation;
    }

    public OffsetDateTime getPutawayCompletedAt() {
        return putawayCompletedAt;
    }

    public void setPutawayCompletedAt(OffsetDateTime putawayCompletedAt) {
        this.putawayCompletedAt = putawayCompletedAt;
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