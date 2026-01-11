package com.pcbxpress.erp.modules.procurement.grn.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "grns", indexes = {
    @Index(name = "idx_grn_number", columnList = "grn_number"),
    @Index(name = "idx_grn_po", columnList = "po_id"),
    @Index(name = "idx_grn_supplier", columnList = "supplier_id"),
    @Index(name = "idx_grn_status", columnList = "status"),
    @Index(name = "idx_grn_received_date", columnList = "received_date"),
    @Index(name = "idx_grn_created_at", columnList = "created_at"),
    @Index(name = "idx_grn_updated_at", columnList = "updated_at")
})
public class Grn {

    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;

    @Column(name = "grn_number", nullable = false, unique = true, length = 50)
    private String grnNumber;

    @Column(name = "grn_date", nullable = false)
    private OffsetDateTime grnDate;

    @Column(name = "po_id", nullable = false)
    private UUID poId;

    @Column(name = "po_number", length = 50)
    private String poNumber;

    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    @Column(name = "supplier_name", nullable = false, length = 200)
    private String supplierName;

    @Column(name = "supplier_code", length = 50)
    private String supplierCode;

    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;

    @Column(name = "warehouse_name", nullable = false, length = 100)
    private String warehouseName;

    @Column(name = "vehicle_number", length = 20)
    private String vehicleNumber;

    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Column(name = "driver_contact", length = 20)
    private String driverContact;

    @Column(name = "received_by", length = 100)
    private String receivedBy;

    @Column(name = "received_at")
    private OffsetDateTime receivedAt;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "total_quantity", precision = 15, scale = 4)
    private BigDecimal totalQuantity;

    @Column(name = "total_value", precision = 15, scale = 2)
    private BigDecimal totalValue;

    @Column(name = "notes", columnDefinition = "text")
    private String notes;

    @Column(name = "qc_required", nullable = false)
    private boolean qcRequired;

    @Column(name = "qc_passed_at")
    private OffsetDateTime qcPassedAt;

    @Column(name = "qc_failed_at")
    private OffsetDateTime qcFailedAt;

    @Column(name = "qc_remarks", columnDefinition = "text")
    private String qcRemarks;

    @Column(name = "putaway_completed_at")
    private OffsetDateTime putawayCompletedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "grn", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<GrnLine> lines = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
        if (grnDate == null) {
            grnDate = now;
        }
        if (receivedAt == null) {
            receivedAt = now;
        }
        if (status == null || status.isBlank()) {
            status = "RECEIVED";
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

    public String getGrnNumber() {
        return grnNumber;
    }

    public void setGrnNumber(String grnNumber) {
        this.grnNumber = grnNumber;
    }

    public OffsetDateTime getGrnDate() {
        return grnDate;
    }

    public void setGrnDate(OffsetDateTime grnDate) {
        this.grnDate = grnDate;
    }

    public UUID getPoId() {
        return poId;
    }

    public void setPoId(UUID poId) {
        this.poId = poId;
    }

    public String getPoNumber() {
        return poNumber;
    }

    public void setPoNumber(String poNumber) {
        this.poNumber = poNumber;
    }

    public UUID getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(UUID supplierId) {
        this.supplierId = supplierId;
    }

    public String getSupplierName() {
        return supplierName;
    }

    public void setSupplierName(String supplierName) {
        this.supplierName = supplierName;
    }

    public String getSupplierCode() {
        return supplierCode;
    }

    public void setSupplierCode(String supplierCode) {
        this.supplierCode = supplierCode;
    }

    public UUID getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(UUID warehouseId) {
        this.warehouseId = warehouseId;
    }

    public String getWarehouseName() {
        return warehouseName;
    }

    public void setWarehouseName(String warehouseName) {
        this.warehouseName = warehouseName;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverContact() {
        return driverContact;
    }

    public void setDriverContact(String driverContact) {
        this.driverContact = driverContact;
    }

    public String getReceivedBy() {
        return receivedBy;
    }

    public void setReceivedBy(String receivedBy) {
        this.receivedBy = receivedBy;
    }

    public OffsetDateTime getReceivedAt() {
        return receivedAt;
    }

    public void setReceivedAt(OffsetDateTime receivedAt) {
        this.receivedAt = receivedAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(BigDecimal totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isQcRequired() {
        return qcRequired;
    }

    public void setQcRequired(boolean qcRequired) {
        this.qcRequired = qcRequired;
    }

    public OffsetDateTime getQcPassedAt() {
        return qcPassedAt;
    }

    public void setQcPassedAt(OffsetDateTime qcPassedAt) {
        this.qcPassedAt = qcPassedAt;
    }

    public OffsetDateTime getQcFailedAt() {
        return qcFailedAt;
    }

    public void setQcFailedAt(OffsetDateTime qcFailedAt) {
        this.qcFailedAt = qcFailedAt;
    }

    public String getQcRemarks() {
        return qcRemarks;
    }

    public void setQcRemarks(String qcRemarks) {
        this.qcRemarks = qcRemarks;
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

    public List<GrnLine> getLines() {
        return lines;
    }

    public void setLines(List<GrnLine> lines) {
        this.lines = lines;
    }

    public void addLine(GrnLine line) {
        lines.add(line);
        line.setGrn(this);
    }

    public void removeLine(GrnLine line) {
        lines.remove(line);
        line.setGrn(null);
    }
}