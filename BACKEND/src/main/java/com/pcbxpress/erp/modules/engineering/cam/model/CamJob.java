package com.pcbxpress.erp.modules.engineering.cam.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "cam_jobs", indexes = {
    @Index(name = "idx_cam_jobs_job_number", columnList = "jobNumber"),
    @Index(name = "idx_cam_jobs_status", columnList = "status"),
    @Index(name = "idx_cam_jobs_customer_id", columnList = "customerId"),
    @Index(name = "idx_cam_jobs_created_at", columnList = "createdAt"),
    @Index(name = "idx_cam_jobs_updated_at", columnList = "updatedAt")
})
public class CamJob {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "job_number", nullable = false, length = 50)
    private String jobNumber;
    
    @Column(name = "customer_id", nullable = false, columnDefinition = "uuid")
    private UUID customerId;
    
    @Column(name = "customer_name", length = 200)
    private String customerName;
    
    @Column(name = "part_number", length = 100)
    private String partNumber;
    
    @Column(name = "revision", length = 20)
    private String revision;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "layer_count")
    private Integer layerCount;
    
    @Column(name = "board_thickness")
    private Double boardThickness;
    
    @Column(name = "copper_thickness")
    private Double copperThickness;
    
    @Column(name = "material_type", length = 100)
    private String materialType;
    
    @Column(name = "solder_mask", length = 50)
    private String solderMask;
    
    @Column(name = "legend", length = 50)
    private String legend;
    
    @Column(name = "surface_finish", length = 50)
    private String surfaceFinish;
    
    @Column(name = "panel_size_x")
    private Double panelSizeX;
    
    @Column(name = "panel_size_y")
    private Double panelSizeY;
    
    @Column(name = "panelization_type", length = 50)
    private String panelizationType;
    
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
    
    @Column(name = "impedance_control", nullable = false)
    private boolean impedanceControl;
    
    @Column(name = "test_points", nullable = false)
    private boolean testPoints;
    
    @Column(name = "fiducials", nullable = false)
    private boolean fiducials;
    
    @Column(name = "tooling_holes", nullable = false)
    private boolean toolingHoles;
    
    @Column(name = "reference_designators", nullable = false)
    private boolean referenceDesignators;
    
    @Column(name = "component_outlines", nullable = false)
    private boolean componentOutlines;
    
    @Column(name = "assembly_variants", length = 200)
    private String assemblyVariants;
    
    @Column(name = "special_instructions", columnDefinition = "text")
    private String specialInstructions;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CamJobStatus status;
    
    @Column(name = "gerber_files", columnDefinition = "jsonb")
    private String gerberFiles;
    
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
    
    @Column(name = "completed_at")
    private OffsetDateTime completedAt;
    
    @Column(name = "assigned_to", columnDefinition = "uuid")
    private UUID assignedTo;
    
    @Column(name = "assigned_name", length = 200)
    private String assignedName;
    
    @Column(name = "priority", length = 20)
    private String priority;
    
    @Column(name = "estimated_hours")
    private Double estimatedHours;
    
    @Column(name = "actual_hours")
    private Double actualHours;
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
    // Getters and Setters
    
    public UUID getId() {
        return id;
    }
    
    public void setId(UUID id) {
        this.id = id;
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
    
    public Integer getLayerCount() {
        return layerCount;
    }
    
    public void setLayerCount(Integer layerCount) {
        this.layerCount = layerCount;
    }
    
    public Double getBoardThickness() {
        return boardThickness;
    }
    
    public void setBoardThickness(Double boardThickness) {
        this.boardThickness = boardThickness;
    }
    
    public Double getCopperThickness() {
        return copperThickness;
    }
    
    public void setCopperThickness(Double copperThickness) {
        this.copperThickness = copperThickness;
    }
    
    public String getMaterialType() {
        return materialType;
    }
    
    public void setMaterialType(String materialType) {
        this.materialType = materialType;
    }
    
    public String getSolderMask() {
        return solderMask;
    }
    
    public void setSolderMask(String solderMask) {
        this.solderMask = solderMask;
    }
    
    public String getLegend() {
        return legend;
    }
    
    public void setLegend(String legend) {
        this.legend = legend;
    }
    
    public String getSurfaceFinish() {
        return surfaceFinish;
    }
    
    public void setSurfaceFinish(String surfaceFinish) {
        this.surfaceFinish = surfaceFinish;
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
    
    public String getPanelizationType() {
        return panelizationType;
    }
    
    public void setPanelizationType(String panelizationType) {
        this.panelizationType = panelizationType;
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
    
    public boolean isImpedanceControl() {
        return impedanceControl;
    }
    
    public void setImpedanceControl(boolean impedanceControl) {
        this.impedanceControl = impedanceControl;
    }
    
    public boolean isTestPoints() {
        return testPoints;
    }
    
    public void setTestPoints(boolean testPoints) {
        this.testPoints = testPoints;
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
    
    public String getAssemblyVariants() {
        return assemblyVariants;
    }
    
    public void setAssemblyVariants(String assemblyVariants) {
        this.assemblyVariants = assemblyVariants;
    }
    
    public String getSpecialInstructions() {
        return specialInstructions;
    }
    
    public void setSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }
    
    public CamJobStatus getStatus() {
        return status;
    }
    
    public void setStatus(CamJobStatus status) {
        this.status = status;
    }
    
    public String getGerberFiles() {
        return gerberFiles;
    }
    
    public void setGerberFiles(String gerberFiles) {
        this.gerberFiles = gerberFiles;
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
    
    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }
    
    public void setCompletedAt(OffsetDateTime completedAt) {
        this.completedAt = completedAt;
    }
    
    public UUID getAssignedTo() {
        return assignedTo;
    }
    
    public void setAssignedTo(UUID assignedTo) {
        this.assignedTo = assignedTo;
    }
    
    public String getAssignedName() {
        return assignedName;
    }
    
    public void setAssignedName(String assignedName) {
        this.assignedName = assignedName;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public Double getEstimatedHours() {
        return estimatedHours;
    }
    
    public void setEstimatedHours(Double estimatedHours) {
        this.estimatedHours = estimatedHours;
    }
    
    public Double getActualHours() {
        return actualHours;
    }
    
    public void setActualHours(Double actualHours) {
        this.actualHours = actualHours;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
}
