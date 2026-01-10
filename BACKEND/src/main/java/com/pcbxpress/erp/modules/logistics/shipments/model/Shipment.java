package com.pcbxpress.erp.modules.logistics.shipments.model;

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
 * Shipment Entity
 * Represents a shipment containing multiple dispatches/packages
 */
@Entity
@Table(name = "shipments", indexes = {
    @Index(name = "idx_shipments_code", columnList = "code"),
    @Index(name = "idx_shipments_status", columnList = "status"),
    @Index(name = "idx_shipments_order_id", columnList = "order_id"),
    @Index(name = "idx_shipments_customer_id", columnList = "customer_id"),
    @Index(name = "idx_shipments_warehouse_id", columnList = "warehouse_id"),
    @Index(name = "idx_shipments_carrier_id", columnList = "carrier_id"),
    @Index(name = "idx_shipments_created_at", columnList = "created_at"),
    @Index(name = "idx_shipments_updated_at", columnList = "updated_at")
})
public class Shipment {
    
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
    
    @Column(name = "carrier_id", nullable = false)
    private UUID carrierId;
    
    @Column(name = "carrier_name", length = 200)
    private String carrierName;
    
    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;
    
    @Column(name = "shipment_date")
    private OffsetDateTime shipmentDate;
    
    @Column(name = "estimated_delivery")
    private OffsetDateTime estimatedDelivery;
    
    @Column(name = "actual_delivery")
    private OffsetDateTime actualDelivery;
    
    @Column(name = "status", length = 50)
    @Enumerated(EnumType.STRING)
    private ShipmentStatus status;
    
    @Column(name = "priority", length = 50)
    @Enumerated(EnumType.STRING)
    private Priority priority;
    
    @Column(name = "shipment_type", length = 50)
    @Enumerated(EnumType.STRING)
    private ShipmentType shipmentType;
    
    @Column(name = "service_level", length = 50)
    @Enumerated(EnumType.STRING)
    private ServiceLevel serviceLevel;
    
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
    
    @Column(name = "package_count")
    private Integer packageCount;
    
    @Column(name = "item_count")
    private Integer itemCount;
    
    @Column(name = "declared_value", precision = 15, scale = 2)
    private BigDecimal declaredValue;
    
    @Column(name = "insurance_value", precision = 15, scale = 2)
    private BigDecimal insuranceValue;
    
    @Column(name = "freight_charge", precision = 15, scale = 2)
    private BigDecimal freightCharge;
    
    @Column(name = "handling_charge", precision = 15, scale = 2)
    private BigDecimal handlingCharge;
    
    @Column(name = "customs_charge", precision = 15, scale = 2)
    private BigDecimal customsCharge;
    
    @Column(name = "total_charge", precision = 15, scale = 2)
    private BigDecimal totalCharge;
    
    @Column(name = "origin_address", columnDefinition = "text")
    private String originAddress;
    
    @Column(name = "destination_address", columnDefinition = "text")
    private String destinationAddress;
    
    @Column(name = "origin_contact", length = 200)
    private String originContact;
    
    @Column(name = "destination_contact", length = 200)
    private String destinationContact;
    
    @Column(name = "origin_phone", length = 50)
    private String originPhone;
    
    @Column(name = "destination_phone", length = 50)
    private String destinationPhone;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    // Audit fields
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @Column(name = "shipped_by", length = 100)
    private String shippedBy;
    
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
    
    public OffsetDateTime getShipmentDate() {
        return shipmentDate;
    }
    
    public void setShipmentDate(OffsetDateTime shipmentDate) {
        this.shipmentDate = shipmentDate;
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
    
    public ShipmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(ShipmentStatus status) {
        this.status = status;
    }
    
    public Priority getPriority() {
        return priority;
    }
    
    public void setPriority(Priority priority) {
        this.priority = priority;
    }
    
    public ShipmentType getShipmentType() {
        return shipmentType;
    }
    
    public void setShipmentType(ShipmentType shipmentType) {
        this.shipmentType = shipmentType;
    }
    
    public ServiceLevel getServiceLevel() {
        return serviceLevel;
    }
    
    public void setServiceLevel(ServiceLevel serviceLevel) {
        this.serviceLevel = serviceLevel;
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
    
    public Integer getPackageCount() {
        return packageCount;
    }
    
    public void setPackageCount(Integer packageCount) {
        this.packageCount = packageCount;
    }
    
    public Integer getItemCount() {
        return itemCount;
    }
    
    public void setItemCount(Integer itemCount) {
        this.itemCount = itemCount;
    }
    
    public BigDecimal getDeclaredValue() {
        return declaredValue;
    }
    
    public void setDeclaredValue(BigDecimal declaredValue) {
        this.declaredValue = declaredValue;
    }
    
    public BigDecimal getInsuranceValue() {
        return insuranceValue;
    }
    
    public void setInsuranceValue(BigDecimal insuranceValue) {
        this.insuranceValue = insuranceValue;
    }
    
    public BigDecimal getFreightCharge() {
        return freightCharge;
    }
    
    public void setFreightCharge(BigDecimal freightCharge) {
        this.freightCharge = freightCharge;
    }
    
    public BigDecimal getHandlingCharge() {
        return handlingCharge;
    }
    
    public void setHandlingCharge(BigDecimal handlingCharge) {
        this.handlingCharge = handlingCharge;
    }
    
    public BigDecimal getCustomsCharge() {
        return customsCharge;
    }
    
    public void setCustomsCharge(BigDecimal customsCharge) {
        this.customsCharge = customsCharge;
    }
    
    public BigDecimal getTotalCharge() {
        return totalCharge;
    }
    
    public void setTotalCharge(BigDecimal totalCharge) {
        this.totalCharge = totalCharge;
    }
    
    public String getOriginAddress() {
        return originAddress;
    }
    
    public void setOriginAddress(String originAddress) {
        this.originAddress = originAddress;
    }
    
    public String getDestinationAddress() {
        return destinationAddress;
    }
    
    public void setDestinationAddress(String destinationAddress) {
        this.destinationAddress = destinationAddress;
    }
    
    public String getOriginContact() {
        return originContact;
    }
    
    public void setOriginContact(String originContact) {
        this.originContact = originContact;
    }
    
    public String getDestinationContact() {
        return destinationContact;
    }
    
    public void setDestinationContact(String destinationContact) {
        this.destinationContact = destinationContact;
    }
    
    public String getOriginPhone() {
        return originPhone;
    }
    
    public void setOriginPhone(String originPhone) {
        this.originPhone = originPhone;
    }
    
    public String getDestinationPhone() {
        return destinationPhone;
    }
    
    public void setDestinationPhone(String destinationPhone) {
        this.destinationPhone = destinationPhone;
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
    
    public String getShippedBy() {
        return shippedBy;
    }
    
    public void setShippedBy(String shippedBy) {
        this.shippedBy = shippedBy;
    }
    
    public String getReceivedBy() {
        return receivedBy;
    }
    
    public void setReceivedBy(String receivedBy) {
        this.receivedBy = receivedBy;
    }
    
    public enum ShipmentStatus {
        DRAFT,
        PREPARING,
        PICKING,
        PACKING,
        READY_TO_SHIP,
        SHIPPED,
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
    
    public enum ShipmentType {
        DOMESTIC,
        INTERNATIONAL,
        EXPRESS,
        FREIGHT,
        COURIER
    }
    
    public enum ServiceLevel {
        STANDARD,
        EXPRESS,
        OVERNIGHT,
        SAME_DAY,
        ECONOMY
    }
}