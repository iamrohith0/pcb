package com.pcbxpress.erp.modules.quality.aoi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "aoi_queue")
public class AOIQueue {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String jobNo;
    
    @Column(nullable = false)
    private String workOrderNo;
    
    @Column(nullable = false)
    private String customer;
    
    @Column(nullable = false)
    private String partNo;
    
    @Column
    private String revision;
    
    @Column(nullable = false)
    private Integer layerCount;
    
    @Column(nullable = false)
    private String line;
    
    @Column(nullable = false)
    private String machine;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;
    
    @Column(nullable = false)
    private Integer panels;
    
    @Column(nullable = false)
    private Integer boards;
    
    @Column
    private LocalDateTime dueDate;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime updatedAt;
    
    @Column
    private String holdReason;
    
    public enum Status {
        QUEUED, RUNNING, HOLD, DONE
    }
    
    public enum Priority {
        LOW, NORMAL, HIGH, URGENT
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getJobNo() {
        return jobNo;
    }
    
    public void setJobNo(String jobNo) {
        this.jobNo = jobNo;
    }
    
    public String getWorkOrderNo() {
        return workOrderNo;
    }
    
    public void setWorkOrderNo(String workOrderNo) {
        this.workOrderNo = workOrderNo;
    }
    
    public String getCustomer() {
        return customer;
    }
    
    public void setCustomer(String customer) {
        this.customer = customer;
    }
    
    public String getPartNo() {
        return partNo;
    }
    
    public void setPartNo(String partNo) {
        this.partNo = partNo;
    }
    
    public String getRevision() {
        return revision;
    }
    
    public void setRevision(String revision) {
        this.revision = revision;
    }
    
    public Integer getLayerCount() {
        return layerCount;
    }
    
    public void setLayerCount(Integer layerCount) {
        this.layerCount = layerCount;
    }
    
    public String getLine() {
        return line;
    }
    
    public void setLine(String line) {
        this.line = line;
    }
    
    public String getMachine() {
        return machine;
    }
    
    public void setMachine(String machine) {
        this.machine = machine;
    }
    
    public Status getStatus() {
        return status;
    }
    
    public void setStatus(Status status) {
        this.status = status;
    }
    
    public Priority getPriority() {
        return priority;
    }
    
    public void setPriority(Priority priority) {
        this.priority = priority;
    }
    
    public Integer getPanels() {
        return panels;
    }
    
    public void setPanels(Integer panels) {
        this.panels = panels;
    }
    
    public Integer getBoards() {
        return boards;
    }
    
    public void setBoards(Integer boards) {
        this.boards = boards;
    }
    
    public LocalDateTime getDueDate() {
        return dueDate;
    }
    
    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getHoldReason() {
        return holdReason;
    }
    
    public void setHoldReason(String holdReason) {
        this.holdReason = holdReason;
    }
}