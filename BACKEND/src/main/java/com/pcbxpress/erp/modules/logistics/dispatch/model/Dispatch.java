package com.pcbxpress.erp.modules.logistics.dispatch.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Dispatch Entity
 * Represents a dispatch operation for shipping orders
 */
@Entity
@Table(name = "dispatches", indexes = {
    @Index(name = "idx_dispatches_code", columnList = "code"),
    @Index(name = "idx_dispatches_status", columnList = "status"),
    @Index(name = "idx_dispatches_order_id", columnList = "order_id"),
    @Index(name = "idx_dispatches_customer_id", columnList = "customer_id"),
    @Index(name = "idx_dispatches_warehouse_id", columnList = "warehouse_id"),
    @Index(name = "idx_dispatches_carrier_id", columnList = "carrier_id"),
    @Index(name = "idx_dispatches_created_at", columnList = "created_at"),
    @Index(name = "idx_dispatches_updated_at", columnList = "updated_at")
})
public class Dispatch {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String code;
    
    @Column(length = 200)
    private String description;
    
    @Column(name = "order_id", nullable = false)
    private UUID orderId;
    
    @Column(name = "order_code", length = 100)
    private String orderCode;
    
    @Column(name = "customer_id", nullable = false)
    private UUID customerId;
    
    @Column(name = "customer_name", length = 200)
    private String customerName;
    
    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;
    
    @Column(name = "warehouse_name", length = 200)
    private String warehouseName;
    
    @Column(name = "carrier_id")
    private UUID carrierId;
    
    @Column(name = "carrier_name", length = 200)
    private String carrierName;
    
    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;
    
    @Column(name = "shipment_id")
    private UUID shipmentId;
    
    @Column(name = "shipment_code", length = 100)
    private String shipmentCode;
    
    @Column(name = "dispatch_date")
    private OffsetDateTime dispatchDate;
    
    @Column(name = "estimated_delivery")
    private OffsetDateTime estimatedDelivery;
    
    @Column(name = "actual_delivery")
    private OffsetDateTime actualDelivery;
    
    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING)
    private DispatchStatus status;
    
    @Column(name = "priority", length = 50)
    @Enumerated(EnumType.STRING)
    private Priority priority;
    
    @Column(name = "dispatch_type", length = 50)
    @Enumerated(EnumType.STRING)
    private DispatchType dispatchType;
    
    @Column(name = "weight", precision = 10, scale = 3)
    private BigDecimal weight;
    
    @Column(name = "weight_unit", length = 20)
    private String weightUnit;
    
    @Column(name = "dimensions_length", precision = 10, scale = 2)
    private BigDecimal dimensionsLength;
    
    @Column(name = "dimensions_width", precision = 10, scale = 2)
    private BigDecimal dimensionsWidth;
    
    @Column(name = "dimensions_height", precision = 10, scale = 2)
    private BigDecimal dimensionsHeight;
    
    @Column(name = "dimensions_unit", length = 20)
    private String dimensionsUnit;
    
    @Column(name = "value", precision = 15, scale = 2)
    private BigDecimal value;
    
    @Column(name = "currency", length = 3)
    private String currency;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    // Audit fields
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @Column(name = "dispatched_by", length = 100)
    private String dispatchedBy;
    
    @Column(name = "received_by", length = 100)
    private String receivedBy;
    
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
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public UUID getOrderId() {
        return orderId;
    }
    
    public void setOrderId(UUID orderId) {
        this.orderId = orderId;
    }
    
    public String getOrderCode() {
        return orderCode;
    }
    
    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }
    
    public UUID getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }
    
    public String getCustomerName() {
        return customerName;
    }
    
    public void setCustomerName(String customerName) {
        this.customerName = customerName;
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
    
    public UUID getCarrierId() {
        return carrierId;
    }
    
    public void setCarrierId(UUID carrierId) {
        this.carrierId = carrierId;
    }
    
    public String getCarrierName() {
        return carrierName;
    }
    
    public void setCarrierName(String carrierName) {
        this.carrierName = carrierName;
    }
    
    public String getTrackingNumber() {
        return trackingNumber;
    }
    
    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }
    
    public UUID getShipmentId() {
        return shipmentId;
    }
    
    public void setShipmentId(UUID shipmentId) {
        this.shipmentId = shipmentId;
    }
    
    public String getShipmentCode() {
        return shipmentCode;
    }
    
    public void setShipmentCode(String shipmentCode) {
        this.shipmentCode = shipmentCode;
    }
    
    public OffsetDateTime getDispatchDate() {
        return dispatchDate;
    }
    
    public void setDispatchDate(OffsetDateTime dispatchDate) {
        this.dispatchDate = dispatchDate;
    }
    
    public OffsetDateTime getEstimatedDelivery() {
        return estimatedDelivery;
    }
    
    public void setEstimatedDelivery(OffsetDateTime estimatedDelivery) {
        this.estimatedDelivery = estimatedDelivery;
    }
    
    public OffsetDateTime getActualDelivery() {
        return actualDelivery;
    }
    
    public void setActualDelivery(OffsetDateTime actualDelivery) {
        this.actualDelivery = actualDelivery;
    }
    
    public DispatchStatus getStatus() {
        return status;
    }
    
    public void setStatus(DispatchStatus status) {
        this.status = status;
    }
    
    public Priority getPriority() {
        return priority;
    }
    
    public void setPriority(Priority priority) {
        this.priority = priority;
    }
    
    public DispatchType getDispatchType() {
        return dispatchType;
    }
    
    public void setDispatchType(DispatchType dispatchType) {
        this.dispatchType = dispatchType;
    }
    
    public BigDecimal getWeight() {
        return weight;
    }
    
    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }
    
    public String getWeightUnit() {
        return weightUnit;
    }
    
    public void setWeightUnit(String weightUnit) {
        this.weightUnit = weightUnit;
    }
    
    public BigDecimal getDimensionsLength() {
        return dimensionsLength;
    }
    
    public void setDimensionsLength(BigDecimal dimensionsLength) {
        this.dimensionsLength = dimensionsLength;
    }
    
    public BigDecimal getDimensionsWidth() {
        return dimensionsWidth;
    }
    
    public void setDimensionsWidth(BigDecimal dimensionsWidth) {
        this.dimensionsWidth = dimensionsWidth;
    }
    
    public BigDecimal getDimensionsHeight() {
        return dimensionsHeight;
    }
    
    public void setDimensionsHeight(BigDecimal dimensionsHeight) {
        this.dimensionsHeight = dimensionsHeight;
    }
    
    public String getDimensionsUnit() {
        return dimensionsUnit;
    }
    
    public void setDimensionsUnit(String dimensionsUnit) {
        this.dimensionsUnit = dimensionsUnit;
    }
    
    public BigDecimal getValue() {
        return value;
    }
    
    public void setValue(BigDecimal value) {
        this.value = value;
    }
    
    public String getCurrency() {
        return currency;
    }
    
    public void setCurrency(String currency) {
        this.currency = currency;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
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
    
    public String getDispatchedBy() {
        return dispatchedBy;
    }
    
    public void setDispatchedBy(String dispatchedBy) {
        this.dispatchedBy = dispatchedBy;
    }
    
    public String getReceivedBy() {
        return receivedBy;
    }
    
    public void setReceivedBy(String receivedBy) {
        this.receivedBy = receivedBy;
    }
    
    public enum DispatchStatus {
        DRAFT,
        PENDING,
        DISPATCHED,
        IN_TRANSIT,
        DELIVERED,
        CANCELLED,
        RETURNED
    }
    
    public enum Priority {
        LOW,
        NORMAL,
        HIGH,
        URGENT
    }
    
    public enum DispatchType {
        STANDARD,
        EXPRESS,
        OVERNIGHT,
        FREIGHT
    }
}