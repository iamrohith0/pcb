package com.pcbxpress.erp.modules.inventory.stock.model;

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
 * Stock Entity
 * Represents inventory stock levels for items in specific locations
 */
@Entity
@Table(name = "inventory_stock", indexes = {
    @Index(name = "idx_stock_item_id", columnList = "item_id"),
    @Index(name = "idx_stock_warehouse_id", columnList = "warehouse_id"),
    @Index(name = "idx_stock_location_id", columnList = "location_id"),
    @Index(name = "idx_stock_lot_id", columnList = "lot_id"),
    @Index(name = "idx_stock_serial_id", columnList = "serial_id"),
    @Index(name = "idx_stock_status", columnList = "status"),
    @Index(name = "idx_stock_created_at", columnList = "created_at"),
    @Index(name = "idx_stock_updated_at", columnList = "updated_at")
})
public class Stock {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "item_id", nullable = false, columnDefinition = "uuid")
    private UUID itemId;
    
    @Column(name = "warehouse_id", nullable = false, columnDefinition = "uuid")
    private UUID warehouseId;
    
    @Column(name = "location_id", columnDefinition = "uuid")
    private UUID locationId;
    
    @Column(name = "lot_id", columnDefinition = "uuid")
    private UUID lotId;
    
    @Column(name = "serial_id", columnDefinition = "uuid")
    private UUID serialId;
    
    @Column(nullable = false)
    private BigDecimal quantity;
    
    @Column(name = "reserved_quantity")
    private BigDecimal reservedQuantity;
    
    @Column(name = "available_quantity")
    private BigDecimal availableQuantity;
    
    @Column(name = "on_order_quantity")
    private BigDecimal onOrderQuantity;
    
    @Column(name = "committed_quantity")
    private BigDecimal committedQuantity;
    
    @Column(name = "stock_status", length = 50)
    @Enumerated(EnumType.STRING)
    private StockStatus stockStatus;
    
    @Column(name = "cost_per_unit", precision = 15, scale = 2)
    private BigDecimal costPerUnit;
    
    @Column(name = "total_value", precision = 15, scale = 2)
    private BigDecimal totalValue;
    
    @Column(name = "last_movement_date")
    private OffsetDateTime lastMovementDate;
    
    @Column(name = "expiration_date")
    private OffsetDateTime expirationDate;
    
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
        calculateAvailableQuantity();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
        calculateAvailableQuantity();
    }
    
    private void calculateAvailableQuantity() {
        if (quantity != null) {
            BigDecimal reserved = reservedQuantity != null ? reservedQuantity : BigDecimal.ZERO;
            BigDecimal committed = committedQuantity != null ? committedQuantity : BigDecimal.ZERO;
            this.availableQuantity = quantity.subtract(reserved).subtract(committed);
        }
    }
    
    // Getters and Setters
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public UUID getItemId() {
        return itemId;
    }
    
    public void setItemId(UUID itemId) {
        this.itemId = itemId;
    }
    
    public UUID getWarehouseId() {
        return warehouseId;
    }
    
    public void setWarehouseId(UUID warehouseId) {
        this.warehouseId = warehouseId;
    }
    
    public UUID getLocationId() {
        return locationId;
    }
    
    public void setLocationId(UUID locationId) {
        this.locationId = locationId;
    }
    
    public UUID getLotId() {
        return lotId;
    }
    
    public void setLotId(UUID lotId) {
        this.lotId = lotId;
    }
    
    public UUID getSerialId() {
        return serialId;
    }
    
    public void setSerialId(UUID serialId) {
        this.serialId = serialId;
    }
    
    public BigDecimal getQuantity() {
        return quantity;
    }
    
    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
        calculateAvailableQuantity();
    }
    
    public BigDecimal getReservedQuantity() {
        return reservedQuantity;
    }
    
    public void setReservedQuantity(BigDecimal reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
        calculateAvailableQuantity();
    }
    
    public BigDecimal getAvailableQuantity() {
        return availableQuantity;
    }
    
    public void setAvailableQuantity(BigDecimal availableQuantity) {
        this.availableQuantity = availableQuantity;
    }
    
    public BigDecimal getOnOrderQuantity() {
        return onOrderQuantity;
    }
    
    public void setOnOrderQuantity(BigDecimal onOrderQuantity) {
        this.onOrderQuantity = onOrderQuantity;
    }
    
    public BigDecimal getCommittedQuantity() {
        return committedQuantity;
    }
    
    public void setCommittedQuantity(BigDecimal committedQuantity) {
        this.committedQuantity = committedQuantity;
        calculateAvailableQuantity();
    }
    
    public StockStatus getStockStatus() {
        return stockStatus;
    }
    
    public void setStockStatus(StockStatus stockStatus) {
        this.stockStatus = stockStatus;
    }
    
    public BigDecimal getCostPerUnit() {
        return costPerUnit;
    }
    
    public void setCostPerUnit(BigDecimal costPerUnit) {
        this.costPerUnit = costPerUnit;
        calculateTotalValue();
    }
    
    public BigDecimal getTotalValue() {
        return totalValue;
    }
    
    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }
    
    public OffsetDateTime getLastMovementDate() {
        return lastMovementDate;
    }
    
    public void setLastMovementDate(OffsetDateTime lastMovementDate) {
        this.lastMovementDate = lastMovementDate;
    }
    
    public OffsetDateTime getExpirationDate() {
        return expirationDate;
    }
    
    public void setExpirationDate(OffsetDateTime expirationDate) {
        this.expirationDate = expirationDate;
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
    
    private void calculateTotalValue() {
        if (quantity != null && costPerUnit != null) {
            this.totalValue = quantity.multiply(costPerUnit);
        }
    }
    
    public enum StockStatus {
        AVAILABLE,
        RESERVED,
        COMMITTED,
        ON_ORDER,
        IN_TRANSIT,
        DAMAGED,
        EXPIRED,
        QUARANTINE
    }
}