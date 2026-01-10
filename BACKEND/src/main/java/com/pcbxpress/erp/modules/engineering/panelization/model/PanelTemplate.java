package com.pcbxpress.erp.modules.engineering.panelization.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "panel_templates", indexes = {
    @Index(name = "idx_panel_templates_name", columnList = "name"),
    @Index(name = "idx_panel_templates_job_id", columnList = "jobId"),
    @Index(name = "idx_panel_templates_status", columnList = "status"),
    @Index(name = "idx_panel_templates_created_at", columnList = "createdAt"),
    @Index(name = "idx_panel_templates_updated_at", columnList = "updatedAt")
})
public class PanelTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(name = "job_id", columnDefinition = "uuid")
    private UUID jobId;
    
    @Column(name = "job_number", length = 50)
    private String jobNumber;
    
    @Column(name = "customer_id", columnDefinition = "uuid")
    private UUID customerId;
    
    @Column(name = "customer_name", length = 200)
    private String customerName;
    
    @Column(name = "part_number", length = 100)
    private String partNumber;
    
    @Column(name = "revision", length = 20)
    private String revision;
    
    @Column(name = "description", columnDefinition = "text")
    private String description;
    
    @Column(name = "panel_size_x")
    private Double panelSizeX;
    
    @Column(name = "panel_size_y")
    private Double panelSizeY;
    
    @Column(name = "panel_thickness")
    private Double panelThickness;
    
    @Column(name = "panel_material", length = 100)
    private String panelMaterial;
    
    @Column(name = "panel_type", length = 50)
    private String panelType;
    
    @Column(name = "routing_type", length = 50)
    private String routingType;
    
    @Column(name = "v_score", nullable = false)
    private boolean vScore;
    
    @Column(name = "tab_rout", nullable = false)
    private boolean tabRout;
    
    @Column(name = "castellated_holes", nullable = false)
    private boolean castellatedHoles;
    
    @Column(name = "edge_plating", nullable = false)
    private boolean edgePlating;
    
    @Column(name = "fiducials", nullable = false)
    private boolean fiducials;
    
    @Column(name = "tooling_holes", nullable = false)
    private boolean toolingHoles;
    
    @Column(name = "reference_designators", nullable = false)
    private boolean referenceDesignators;
    
    @Column(name = "component_outlines", nullable = false)
    private boolean componentOutlines;
    
    @Column(name = "panelization_style", length = 50)
    private String panelizationStyle;
    
    @Column(name = "array_x")
    private Integer arrayX;
    
    @Column(name = "array_y")
    private Integer arrayY;
    
    @Column(name = "board_x")
    private Double boardX;
    
    @Column(name = "board_y")
    private Double boardY;
    
    @Column(name = "spacing_x")
    private Double spacingX;
    
    @Column(name = "spacing_y")
    private Double spacingY;
    
    @Column(name = "rail_width_left")
    private Double railWidthLeft;
    
    @Column(name = "rail_width_right")
    private Double railWidthRight;
    
    @Column(name = "rail_width_top")
    private Double railWidthTop;
    
    @Column(name = "rail_width_bottom")
    private Double railWidthBottom;
    
    @Column(name = "rail_tooling_holes", nullable = false)
    private boolean railToolingHoles;
    
    @Column(name = "rail_fiducials", nullable = false)
    private boolean railFiducials;
    
    @Column(name = "rail_text", length = 500)
    private String railText;
    
    @Column(name = "breakaway_corners", nullable = false)
    private boolean breakawayCorners;
    
    @Column(name = "corner_radius")
    private Double cornerRadius;
    
    @Column(name = "mouse_bites", nullable = false)
    private boolean mouseBites;
    
    @Column(name = "v_score_width")
    private Double vScoreWidth;
    
    @Column(name = "v_score_angle")
    private Double vScoreAngle;
    
    @Column(name = "tab_width")
    private Double tabWidth;
    
    @Column(name = "tab_length")
    private Double tabLength;
    
    @Column(name = "tab_spacing")
    private Double tabSpacing;
    
    @Column(name = "castellated_hole_size")
    private Double castellatedHoleSize;
    
    @Column(name = "castellated_hole_spacing")
    private Double castellatedHoleSpacing;
    
    @Column(name = "edge_plating_thickness")
    private Double edgePlatingThickness;
    
    @Column(name = "fiducial_size")
    private Double fiducialSize;
    
    @Column(name = "fiducial_clearance")
    private Double fiducialClearance;
    
    @Column(name = "tooling_hole_size")
    private Double toolingHoleSize;
    
    @Column(name = "tooling_hole_clearance")
    private Double toolingHoleClearance;
    
    @Column(name = "reference_text_size")
    private Double referenceTextSize;
    
    @Column(name = "reference_text_clearance")
    private Double referenceTextClearance;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PanelStatus status;
    
    @Column(name = "created_by", columnDefinition = "uuid")
    private UUID createdBy;
    
    @Column(name = "created_by_name", length = 200)
    private String createdByName;
    
    @Column(name = "approved_by", columnDefinition = "uuid")
    private UUID approvedBy;
    
    @Column(name = "approved_by_name", length = 200)
    private String approvedByName;
    
    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;
    
    @Column(name = "version")
    private Integer version;
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive;
    
    @Column(name = "is_default", nullable = false)
    private boolean isDefault;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    // Getters and Setters
    
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public UUID getJobId() {
        return jobId;
    }
    
    public void setJobId(UUID jobId) {
        this.jobId = jobId;
    }
    
    public String getJobNumber() {
        return jobNumber;
    }
    
    public void setJobNumber(String jobNumber) {
        this.jobNumber = jobNumber;
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
    
    public String getPartNumber() {
        return partNumber;
    }
    
    public void setPartNumber(String partNumber) {
        this.partNumber = partNumber;
    }
    
    public String getRevision() {
        return revision;
    }
    
    public void setRevision(String revision) {
        this.revision = revision;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public Double getPanelSizeX() {
        return panelSizeX;
    }
    
    public void setPanelSizeX(Double panelSizeX) {
        this.panelSizeX = panelSizeX;
    }
    
    public Double getPanelSizeY() {
        return panelSizeY;
    }
    
    public void setPanelSizeY(Double panelSizeY) {
        this.panelSizeY = panelSizeY;
    }
    
    public Double getPanelThickness() {
        return panelThickness;
    }
    
    public void setPanelThickness(Double panelThickness) {
        this.panelThickness = panelThickness;
    }
    
    public String getPanelMaterial() {
        return panelMaterial;
    }
    
    public void setPanelMaterial(String panelMaterial) {
        this.panelMaterial = panelMaterial;
    }
    
    public String getPanelType() {
        return panelType;
    }
    
    public void setPanelType(String panelType) {
        this.panelType = panelType;
    }
    
    public String getRoutingType() {
        return routingType;
    }
    
    public void setRoutingType(String routingType) {
        this.routingType = routingType;
    }
    
    public boolean isVScore() {
        return vScore;
    }
    
    public void setVScore(boolean vScore) {
        this.vScore = vScore;
    }
    
    public boolean isTabRout() {
        return tabRout;
    }
    
    public void setTabRout(boolean tabRout) {
        this.tabRout = tabRout;
    }
    
    public boolean isCastellatedHoles() {
        return castellatedHoles;
    }
    
    public void setCastellatedHoles(boolean castellatedHoles) {
        this.castellatedHoles = castellatedHoles;
    }
    
    public boolean isEdgePlating() {
        return edgePlating;
    }
    
    public void setEdgePlating(boolean edgePlating) {
        this.edgePlating = edgePlating;
    }
    
    public boolean isFiducials() {
        return fiducials;
    }
    
    public void setFiducials(boolean fiducials) {
        this.fiducials = fiducials;
    }
    
    public boolean isToolingHoles() {
        return toolingHoles;
    }
    
    public void setToolingHoles(boolean toolingHoles) {
        this.toolingHoles = toolingHoles;
    }
    
    public boolean isReferenceDesignators() {
        return referenceDesignators;
    }
    
    public void setReferenceDesignators(boolean referenceDesignators) {
        this.referenceDesignators = referenceDesignators;
    }
    
    public boolean isComponentOutlines() {
        return componentOutlines;
    }
    
    public void setComponentOutlines(boolean componentOutlines) {
        this.componentOutlines = componentOutlines;
    }
    
    public String getPanelizationStyle() {
        return panelizationStyle;
    }
    
    public void setPanelizationStyle(String panelizationStyle) {
        this.panelizationStyle = panelizationStyle;
    }
    
    public Integer getArrayX() {
        return arrayX;
    }
    
    public void setArrayX(Integer arrayX) {
        this.arrayX = arrayX;
    }
    
    public Integer getArrayY() {
        return arrayY;
    }
    
    public void setArrayY(Integer arrayY) {
        this.arrayY = arrayY;
    }
    
    public Double getBoardX() {
        return boardX;
    }
    
    public void setBoardX(Double boardX) {
        this.boardX = boardX;
    }
    
    public Double getBoardY() {
        return boardY;
    }
    
    public void setBoardY(Double boardY) {
        this.boardY = boardY;
    }
    
    public Double getSpacingX() {
        return spacingX;
    }
    
    public void setSpacingX(Double spacingX) {
        this.spacingX = spacingX;
    }
    
    public Double getSpacingY() {
        return spacingY;
    }
    
    public void setSpacingY(Double spacingY) {
        this.spacingY = spacingY;
    }
    
    public Double getRailWidthLeft() {
        return railWidthLeft;
    }
    
    public void setRailWidthLeft(Double railWidthLeft) {
        this.railWidthLeft = railWidthLeft;
    }
    
    public Double getRailWidthRight() {
        return railWidthRight;
    }
    
    public void setRailWidthRight(Double railWidthRight) {
        this.railWidthRight = railWidthRight;
    }
    
    public Double getRailWidthTop() {
        return railWidthTop;
    }
    
    public void setRailWidthTop(Double railWidthTop) {
        this.railWidthTop = railWidthTop;
    }
    
    public Double getRailWidthBottom() {
        return railWidthBottom;
    }
    
    public void setRailWidthBottom(Double railWidthBottom) {
        this.railWidthBottom = railWidthBottom;
    }
    
    public boolean isRailToolingHoles() {
        return railToolingHoles;
    }
    
    public void setRailToolingHoles(boolean railToolingHoles) {
        this.railToolingHoles = railToolingHoles;
    }
    
    public boolean isRailFiducials() {
        return railFiducials;
    }
    
    public void setRailFiducials(boolean railFiducials) {
        this.railFiducials = railFiducials;
    }
    
    public String getRailText() {
        return railText;
    }
    
    public void setRailText(String railText) {
        this.railText = railText;
    }
    
    public boolean isBreakawayCorners() {
        return breakawayCorners;
    }
    
    public void setBreakawayCorners(boolean breakawayCorners) {
        this.breakawayCorners = breakawayCorners;
    }
    
    public Double getCornerRadius() {
        return cornerRadius;
    }
    
    public void setCornerRadius(Double cornerRadius) {
        this.cornerRadius = cornerRadius;
    }
    
    public boolean isMouseBites() {
        return mouseBites;
    }
    
    public void setMouseBites(boolean mouseBites) {
        this.mouseBites = mouseBites;
    }
    
    public Double getVScoreWidth() {
        return vScoreWidth;
    }
    
    public void setVScoreWidth(Double vScoreWidth) {
        this.vScoreWidth = vScoreWidth;
    }
    
    public Double getVScoreAngle() {
        return vScoreAngle;
    }
    
    public void setVScoreAngle(Double vScoreAngle) {
        this.vScoreAngle = vScoreAngle;
    }
    
    public Double getTabWidth() {
        return tabWidth;
    }
    
    public void setTabWidth(Double tabWidth) {
        this.tabWidth = tabWidth;
    }
    
    public Double getTabLength() {
        return tabLength;
    }
    
    public void setTabLength(Double tabLength) {
        this.tabLength = tabLength;
    }
    
    public Double getTabSpacing() {
        return tabSpacing;
    }
    
    public void setTabSpacing(Double tabSpacing) {
        this.tabSpacing = tabSpacing;
    }
    
    public Double getCastellatedHoleSize() {
        return castellatedHoleSize;
    }
    
    public void setCastellatedHoleSize(Double castellatedHoleSize) {
        this.castellatedHoleSize = castellatedHoleSize;
    }
    
    public Double getCastellatedHoleSpacing() {
        return castellatedHoleSpacing;
    }
    
    public void setCastellatedHoleSpacing(Double castellatedHoleSpacing) {
        this.castellatedHoleSpacing = castellatedHoleSpacing;
    }
    
    public Double getEdgePlatingThickness() {
        return edgePlatingThickness;
    }
    
    public void setEdgePlatingThickness(Double edgePlatingThickness) {
        this.edgePlatingThickness = edgePlatingThickness;
    }
    
    public Double getFiducialSize() {
        return fiducialSize;
    }
    
    public void setFiducialSize(Double fiducialSize) {
        this.fiducialSize = fiducialSize;
    }
    
    public Double getFiducialClearance() {
        return fiducialClearance;
    }
    
    public void setFiducialClearance(Double fiducialClearance) {
        this.fiducialClearance = fiducialClearance;
    }
    
    public Double getToolingHoleSize() {
        return toolingHoleSize;
    }
    
    public void setToolingHoleSize(Double toolingHoleSize) {
        this.toolingHoleSize = toolingHoleSize;
    }
    
    public Double getToolingHoleClearance() {
        return toolingHoleClearance;
    }
    
    public void setToolingHoleClearance(Double toolingHoleClearance) {
        this.toolingHoleClearance = toolingHoleClearance;
    }
    
    public Double getReferenceTextSize() {
        return referenceTextSize;
    }
    
    public void setReferenceTextSize(Double referenceTextSize) {
        this.referenceTextSize = referenceTextSize;
    }
    
    public Double getReferenceTextClearance() {
        return referenceTextClearance;
    }
    
    public void setReferenceTextClearance(Double referenceTextClearance) {
        this.referenceTextClearance = referenceTextClearance;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public PanelStatus getStatus() {
        return status;
    }
    
    public void setStatus(PanelStatus status) {
        this.status = status;
    }
    
    public UUID getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }
    
    public String getCreatedByName() {
        return createdByName;
    }
    
    public void setCreatedByName(String createdByName) {
        this.createdByName = createdByName;
    }
    
    public UUID getApprovedBy() {
        return approvedBy;
    }
    
    public void setApprovedBy(UUID approvedBy) {
        this.approvedBy = approvedBy;
    }
    
    public String getApprovedByName() {
        return approvedByName;
    }
    
    public void setApprovedByName(String approvedByName) {
        this.approvedByName = approvedByName;
    }
    
    public OffsetDateTime getApprovedAt() {
        return approvedAt;
    }
    
    public void setApprovedAt(OffsetDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
    
    public Integer getVersion() {
        return version;
    }
    
    public void setVersion(Integer version) {
        this.version = version;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    public boolean isDefault() {
        return isDefault;
    }
    
    public void setDefault(boolean aDefault) {
        isDefault = aDefault;
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
}
