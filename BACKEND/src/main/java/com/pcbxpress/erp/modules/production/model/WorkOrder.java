package com.pcbxpress.erp.modules.production.model;

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
import java.time.LocalDate;
import java.util.UUID;

/**
 * Work Order Entity
 * Represents a production order for manufacturing PCBs
 */
@Entity
@Table(name = "work_orders", indexes = {
    @Index(name = "idx_work_orders_number", columnList = "work_order_number"),
    @Index(name = "idx_work_orders_status", columnList = "status"),
    @Index(name = "idx_work_orders_customer_po", columnList = "customer_po"),
    @Index(name = "idx_work_orders_item_code", columnList = "item_code"),
    @Index(name = "idx_work_orders_created_at", columnList = "created_at"),
    @Index(name = "idx_work_orders_updated_at", columnList = "updated_at"),
    @Index(name = "idx_work_orders_due_date", columnList = "due_date"),
    @Index(name = "idx_work_orders_start_date", columnList = "start_date")
})
public class WorkOrder {
    
    @Id
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "work_order_number", nullable = false, unique = true, length = 50)
    private String workOrderNumber;
    
    @Column(name = "customer_po", length = 100)
    private String customerPO;
    
    @Column(name = "item_code", nullable = false, length = 50)
    private String itemCode;
    
    @Column(name = "item_description", length = 500)
    private String itemDescription;
    
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    
    @Column(name = "status", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private WorkOrderStatus status;
    
    @Column(name = "priority", length = 20)
    @Enumerated(EnumType.STRING)
    private Priority priority;
    
    @Column(name = "routing_id")
    private UUID routingId;
    
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @Column(name = "due_date")
    private LocalDate dueDate;
    
    @Column(name = "completed_date")
    private LocalDate completedDate;
    
    @Column(name = "completed_quantity")
    private Integer completedQuantity;
    
    @Column(name = "scrap_quantity")
    private Integer scrapQuantity;
    
    @Column(name = "estimated_hours")
    private BigDecimal estimatedHours;
    
    @Column(name = "actual_hours")
    private BigDecimal actualHours;
    
    @Column(name = "routing_notes", columnDefinition = "text")
    private String routingNotes;
    
    @Column(name = "quality_notes", columnDefinition = "text")
    private String qualityNotes;
    
    @Column(name = "production_notes", columnDefinition = "text")
    private String productionNotes;
    
    @Column(name = "is_rush", nullable = false)
    private boolean isRush;
    
    @Column(name = "is_critical", nullable = false)
    private boolean isCritical;
    
    @Column(name = "customer_id")
    private UUID customerId;
    
    @Column(name = "sales_order_id")
    private UUID salesOrderId;
    
    @Column(name = "project_id")
    private UUID projectId;
    
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
    
    public String getWorkOrderNumber() {
        return workOrderNumber;
    }
    
    public void setWorkOrderNumber(String workOrderNumber) {
        this.workOrderNumber = workOrderNumber;
    }
    
    public String getCustomerPO() {
        return customerPO;
    }
    
    public void setCustomerPO(String customerPO) {
        this.customerPO = customerPO;
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
    
    public Integer getQuantity() {
        return quantity;
    }
    
    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
    
    public WorkOrderStatus getStatus() {
        return status;
    }
    
    public void setStatus(WorkOrderStatus status) {
        this.status = status;
    }
    
    public Priority getPriority() {
        return priority;
    }
    
    public void setPriority(Priority priority) {
        this.priority = priority;
    }
    
    public UUID getRoutingId() {
        return routingId;
    }
    
    public void setRoutingId(UUID routingId) {
        this.routingId = routingId;
    }
    
    public LocalDate getStartDate() {
        return startDate;
    }
    
    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }
    
    public LocalDate getDueDate() {
        return dueDate;
    }
    
    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
    
    public LocalDate getCompletedDate() {
        return completedDate;
    }
    
    public void setCompletedDate(LocalDate completedDate) {
        this.completedDate = completedDate;
    }
    
    public Integer getCompletedQuantity() {
        return completedQuantity;
    }
    
    public void setCompletedQuantity(Integer completedQuantity) {
        this.completedQuantity = completedQuantity;
    }
    
    public Integer getScrapQuantity() {
        return scrapQuantity;
    }
    
    public void setScrapQuantity(Integer scrapQuantity) {
        this.scrapQuantity = scrapQuantity;
    }
    
    public BigDecimal getEstimatedHours() {
        return estimatedHours;
    }
    
    public void setEstimatedHours(BigDecimal estimatedHours) {
        this.estimatedHours = estimatedHours;
    }
    
    public BigDecimal getActualHours() {
        return actualHours;
    }
    
    public void setActualHours(BigDecimal actualHours) {
        this.actualHours = actualHours;
    }
    
    public String getRoutingNotes() {
        return routingNotes;
    }
    
    public void setRoutingNotes(String routingNotes) {
        this.routingNotes = routingNotes;
    }
    
    public String getQualityNotes() {
        return qualityNotes;
    }
    
    public void setQualityNotes(String qualityNotes) {
        this.qualityNotes = qualityNotes;
    }
    
    public String getProductionNotes() {
        return productionNotes;
    }
    
    public void setProductionNotes(String productionNotes) {
        this.productionNotes = productionNotes;
    }
    
    public boolean isRush() {
        return isRush;
    }
    
    public void setRush(boolean rush) {
        isRush = rush;
    }
    
    public boolean isCritical() {
        return isCritical;
    }
    
    public void setCritical(boolean critical) {
        isCritical = critical;
    }
    
    public UUID getCustomerId() {
        return customerId;
    }
    
    public void setCustomerId(UUID customerId) {
        this.customerId = customerId;
    }
    
    public UUID getSalesOrderId() {
        return salesOrderId;
    }
    
    public void setSalesOrderId(UUID salesOrderId) {
        this.salesOrderId = salesOrderId;
    }
    
    public UUID getProjectId() {
        return projectId;
    }
    
    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
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
    
    public enum WorkOrderStatus {
        DRAFT,
        RELEASED,
        IN_PROGRESS,
        ON_HOLD,
        COMPLETED,
        CANCELLED
    }
    
    public enum Priority {
        LOW,
        MEDIUM,
        HIGH,
        URGENT
    }
}