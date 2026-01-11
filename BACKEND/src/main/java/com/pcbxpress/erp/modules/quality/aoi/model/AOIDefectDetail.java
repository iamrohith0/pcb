package com.pcbxpress.erp.modules.quality.aoi.model;

import jakarta.persistence.*;

@Entity
@Table(name = "aoi_defect_details")
public class AOIDefectDetail {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aoi_result_id")
    private AOIResult aoiResult;
    
    @Column
    private String code;
    
    @Column
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column
    private Side side;
    
    @Column
    private Double x;
    
    @Column
    private Double y;
    
    @Enumerated(EnumType.STRING)
    @Column
    private Severity severity;
    
    @Column(length = 1000)
    private String comment;
    
    public enum Side {
        TOP, BOTTOM, BOTH
    }
    
    public enum Severity {
        MINOR, MAJOR, CRITICAL
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public AOIResult getAoiResult() {
        return aoiResult;
    }
    
    public void setAoiResult(AOIResult aoiResult) {
        this.aoiResult = aoiResult;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public Side getSide() {
        return side;
    }
    
    public void setSide(Side side) {
        this.side = side;
    }
    
    public Double getX() {
        return x;
    }
    
    public void setX(Double x) {
        this.x = x;
    }
    
    public Double getY() {
        return y;
    }
    
    public void setY(Double y) {
        this.y = y;
    }
    
    public Severity getSeverity() {
        return severity;
    }
    
    public void setSeverity(Severity severity) {
        this.severity = severity;
    }
    
    public String getComment() {
        return comment;
    }
    
    public void setComment(String comment) {
        this.comment = comment;
    }
}