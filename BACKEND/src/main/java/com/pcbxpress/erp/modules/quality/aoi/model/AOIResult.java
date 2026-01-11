package com.pcbxpress.erp.modules.quality.aoi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "aoi_results")
public class AOIResult {
    
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
    
    @Column(nullable = false)
    private LocalDateTime inspectedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResultStatus resultStatus;
    
    @Column(nullable = false)
    private Integer defectCount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;
    
    @Column
    private String programName;
    
    @Column
    private String operator;
    
    @Column(length = 1000)
    private String notes;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "aoiResult", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AOIDefectDetail> defects = new ArrayList<>();
    
    public enum ResultStatus {
        PASS, FAIL, REWORK, SCRAP
    }
    
    public enum Severity {
        MINOR, MAJOR, CRITICAL
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
    
    public LocalDateTime getInspectedAt() {
        return inspectedAt;
    }
    
    public void setInspectedAt(LocalDateTime inspectedAt) {
        this.inspectedAt = inspectedAt;
    }
    
    public ResultStatus getResultStatus() {
        return resultStatus;
    }
    
    public void setResultStatus(ResultStatus resultStatus) {
        this.resultStatus = resultStatus;
    }
    
    public Integer getDefectCount() {
        return defectCount;
    }
    
    public void setDefectCount(Integer defectCount) {
        this.defectCount = defectCount;
    }
    
    public Severity getSeverity() {
        return severity;
    }
    
    public void setSeverity(Severity severity) {
        this.severity = severity;
    }
    
    public String getProgramName() {
        return programName;
    }
    
    public void setProgramName(String programName) {
        this.programName = programName;
    }
    
    public String getOperator() {
        return operator;
    }
    
    public void setOperator(String operator) {
        this.operator = operator;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
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
    
    public List<AOIDefectDetail> getDefects() {
        return defects;
    }
    
    public void setDefects(List<AOIDefectDetail> defects) {
        this.defects = defects;
    }
    
    public void addDefect(AOIDefectDetail defect) {
        defects.add(defect);
        defect.setAoiResult(this);
    }
    
    public void removeDefect(AOIDefectDetail defect) {
        defects.remove(defect);
        defect.setAoiResult(null);
    }
}