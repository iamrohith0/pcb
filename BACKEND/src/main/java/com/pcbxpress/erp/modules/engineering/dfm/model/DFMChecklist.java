package com.pcbxpress.erp.modules.engineering.dfm.model;

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
@Table(name = "dfm_checklists", indexes = {
    @Index(name = "idx_dfm_checklists_job_id", columnList = "jobId"),
    @Index(name = "idx_dfm_checklists_status", columnList = "status"),
    @Index(name = "idx_dfm_checklists_created_at", columnList = "createdAt"),
    @Index(name = "idx_dfm_checklists_updated_at", columnList = "updatedAt")
})
public class DFMChecklist {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "job_id", nullable = false, columnDefinition = "uuid")
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
    
    // DFM Check Items
    @Column(name = "min_trace_width")
    private Double minTraceWidth;
    
    @Column(name = "min_trace_spacing")
    private Double minTraceSpacing;
    
    @Column(name = "min_hole_size")
    private Double minHoleSize;
    
    @Column(name = "min_annular_ring")
    private Double minAnnularRing;
    
    @Column(name = "copper_clearance")
    private Double copperClearance;
    
    @Column(name = "soldermask_clearance")
    private Double soldermaskClearance;
    
    @Column(name = "silkscreen_clearance")
    private Double silkscreenClearance;
    
    @Column(name = "vias_in_pads", nullable = false)
    private boolean viasInPads;
    
    @Column(name = "blind_buried_vias", nullable = false)
    private boolean blindBuriedVias;
    
    @Column(name = "impedance_controlled", nullable = false)
    private boolean impedanceControlled;
    
    @Column(name = "controlled_depth_routing", nullable = false)
    private boolean controlledDepthRouting;
    
    @Column(name = "castellated_holes", nullable = false)
    private boolean castellatedHoles;
    
    @Column(name = "edge_plating", nullable = false)
    private boolean edgePlating;
    
    @Column(name = "backdrilling", nullable = false)
    private boolean backdrilling;
    
    @Column(name = "laser_drilling", nullable = false)
    private boolean laserDrilling;
    
    @Column(name = "rigid_flex", nullable = false)
    private boolean rigidFlex;
    
    @Column(name = "hdI", nullable = false)
    private boolean hdi;
    
    @Column(name = "flex_rigid", nullable = false)
    private boolean flexRigid;
    
    @Column(name = "flex_cable", nullable = false)
    private boolean flexCable;
    
    @Column(name = "rigid_pcb", nullable = false)
    private boolean rigidPcb;
    
    @Column(name = "metal_core", nullable = false)
    private boolean metalCore;
    
    @Column(name = "ceramic_substrate", nullable = false)
    private boolean ceramicSubstrate;
    
    @Column(name = "high_freq_material", nullable = false)
    private boolean highFreqMaterial;
    
    @Column(name = "high_temp_material", nullable = false)
    private boolean highTempMaterial;
    
    @Column(name = "flexible_material", nullable = false)
    private boolean flexibleMaterial;
    
    @Column(name = "rigid_material", nullable = false)
    private boolean rigidMaterial;
    
    @Column(name = "standard_material", nullable = false)
    private boolean standardMaterial;
    
    @Column(name = "special_material", nullable = false)
    private boolean specialMaterial;
    
    @Column(name = "material_notes", columnDefinition = "text")
    private String materialNotes;
    
    @Column(name = "design_notes", columnDefinition = "text")
    private String designNotes;
    
    @Column(name = "manufacturing_notes", columnDefinition = "text")
    private String manufacturingNotes;
    
    @Column(name = "test_notes", columnDefinition = "text")
    private String testNotes;
    
    @Column(name = "assembly_notes", columnDefinition = "text")
    private String assemblyNotes;
    
    @Column(name = "packaging_notes", columnDefinition = "text")
    private String packagingNotes;
    
    @Column(name = "shipping_notes", columnDefinition = "text")
    private String shippingNotes;
    
    @Column(name = "cost_notes", columnDefinition = "text")
    private String costNotes;
    
    @Column(name = "schedule_notes", columnDefinition = "text")
    private String scheduleNotes;
    
    @Column(name = "quality_notes", columnDefinition = "text")
    private String qualityNotes;
    
    @Column(name = "reliability_notes", columnDefinition = "text")
    private String reliabilityNotes;
    
    @Column(name = "environmental_notes", columnDefinition = "text")
    private String environmentalNotes;
    
    @Column(name = "compliance_notes", columnDefinition = "text")
    private String complianceNotes;
    
    @Column(name = "safety_notes", columnDefinition = "text")
    private String safetyNotes;
    
    @Column(name = "regulatory_notes", columnDefinition = "text")
    private String regulatoryNotes;
    
    @Column(name = "customer_requirements", columnDefinition = "text")
    private String customerRequirements;
    
    @Column(name = "engineering_requirements", columnDefinition = "text")
    private String engineeringRequirements;
    
    @Column(name = "manufacturing_requirements", columnDefinition = "text")
    private String manufacturingRequirements;
    
    @Column(name = "test_requirements", columnDefinition = "text")
    private String testRequirements;
    
    @Column(name = "assembly_requirements", columnDefinition = "text")
    private String assemblyRequirements;
    
    @Column(name = "packaging_requirements", columnDefinition = "text")
    private String packagingRequirements;
    
    @Column(name = "shipping_requirements", columnDefinition = "text")
    private String shippingRequirements;
    
    @Column(name = "cost_requirements", columnDefinition = "text")
    private String costRequirements;
    
    @Column(name = "schedule_requirements", columnDefinition = "text")
    private String scheduleRequirements;
    
    @Column(name = "quality_requirements", columnDefinition = "text")
    private String qualityRequirements;
    
    @Column(name = "reliability_requirements", columnDefinition = "text")
    private String reliabilityRequirements;
    
    @Column(name = "environmental_requirements", columnDefinition = "text")
    private String environmentalRequirements;
    
    @Column(name = "compliance_requirements", columnDefinition = "text")
    private String complianceRequirements;
    
    @Column(name = "safety_requirements", columnDefinition = "text")
    private String safetyRequirements;
    
    @Column(name = "regulatory_requirements", columnDefinition = "text")
    private String regulatoryRequirements;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DFMStatus status;
    
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
    
    @Column(name = "rejected_by", columnDefinition = "uuid")
    private UUID rejectedBy;
    
    @Column(name = "rejected_by_name", length = 200)
    private String rejectedByName;
    
    @Column(name = "rejected_at")
    private OffsetDateTime rejectedAt;
    
    @Column(name = "rejected_reason", columnDefinition = "text")
    private String rejectedReason;
    
    @Column(name = "version")
    private Integer version;
    
    @Column(name = "is_latest", nullable = false)
    private boolean isLatest;
    
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
    
    public Double getMinTraceWidth() {
        return minTraceWidth;
    }
    
    public void setMinTraceWidth(Double minTraceWidth) {
        this.minTraceWidth = minTraceWidth;
    }
    
    public Double getMinTraceSpacing() {
        return minTraceSpacing;
    }
    
    public void setMinTraceSpacing(Double minTraceSpacing) {
        this.minTraceSpacing = minTraceSpacing;
    }
    
    public Double getMinHoleSize() {
        return minHoleSize;
    }
    
    public void setMinHoleSize(Double minHoleSize) {
        this.minHoleSize = minHoleSize;
    }
    
    public Double getMinAnnularRing() {
        return minAnnularRing;
    }
    
    public void setMinAnnularRing(Double minAnnularRing) {
        this.minAnnularRing = minAnnularRing;
    }
    
    public Double getCopperClearance() {
        return copperClearance;
    }
    
    public void setCopperClearance(Double copperClearance) {
        this.copperClearance = copperClearance;
    }
    
    public Double getSoldermaskClearance() {
        return soldermaskClearance;
    }
    
    public void setSoldermaskClearance(Double soldermaskClearance) {
        this.soldermaskClearance = soldermaskClearance;
    }
    
    public Double getSilkscreenClearance() {
        return silkscreenClearance;
    }
    
    public void setSilkscreenClearance(Double silkscreenClearance) {
        this.silkscreenClearance = silkscreenClearance;
    }
    
    public boolean isViasInPads() {
        return viasInPads;
    }
    
    public void setViasInPads(boolean viasInPads) {
        this.viasInPads = viasInPads;
    }
    
    public boolean isBlindBuriedVias() {
        return blindBuriedVias;
    }
    
    public void setBlindBuriedVias(boolean blindBuriedVias) {
        this.blindBuriedVias = blindBuriedVias;
    }
    
    public boolean isImpedanceControlled() {
        return impedanceControlled;
    }
    
    public void setImpedanceControlled(boolean impedanceControlled) {
        this.impedanceControlled = impedanceControlled;
    }
    
    public boolean isControlledDepthRouting() {
        return controlledDepthRouting;
    }
    
    public void setControlledDepthRouting(boolean controlledDepthRouting) {
        this.controlledDepthRouting = controlledDepthRouting;
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
    
    public boolean isBackdrilling() {
        return backdrilling;
    }
    
    public void setBackdrilling(boolean backdrilling) {
        this.backdrilling = backdrilling;
    }
    
    public boolean isLaserDrilling() {
        return laserDrilling;
    }
    
    public void setLaserDrilling(boolean laserDrilling) {
        this.laserDrilling = laserDrilling;
    }
    
    public boolean isRigidFlex() {
        return rigidFlex;
    }
    
    public void setRigidFlex(boolean rigidFlex) {
        this.rigidFlex = rigidFlex;
    }
    
    public boolean isHdi() {
        return hdi;
    }
    
    public void setHdi(boolean hdi) {
        this.hdi = hdi;
    }
    
    public boolean isFlexRigid() {
        return flexRigid;
    }
    
    public void setFlexRigid(boolean flexRigid) {
        this.flexRigid = flexRigid;
    }
    
    public boolean isFlexCable() {
        return flexCable;
    }
    
    public void setFlexCable(boolean flexCable) {
        this.flexCable = flexCable;
    }
    
    public boolean isRigidPcb() {
        return rigidPcb;
    }
    
    public void setRigidPcb(boolean rigidPcb) {
        this.rigidPcb = rigidPcb;
    }
    
    public boolean isMetalCore() {
        return metalCore;
    }
    
    public void setMetalCore(boolean metalCore) {
        this.metalCore = metalCore;
    }
    
    public boolean isCeramicSubstrate() {
        return ceramicSubstrate;
    }
    
    public void setCeramicSubstrate(boolean ceramicSubstrate) {
        this.ceramicSubstrate = ceramicSubstrate;
    }
    
    public boolean isHighFreqMaterial() {
        return highFreqMaterial;
    }
    
    public void setHighFreqMaterial(boolean highFreqMaterial) {
        this.highFreqMaterial = highFreqMaterial;
    }
    
    public boolean isHighTempMaterial() {
        return highTempMaterial;
    }
    
    public void setHighTempMaterial(boolean highTempMaterial) {
        this.highTempMaterial = highTempMaterial;
    }
    
    public boolean isFlexibleMaterial() {
        return flexibleMaterial;
    }
    
    public void setFlexibleMaterial(boolean flexibleMaterial) {
        this.flexibleMaterial = flexibleMaterial;
    }
    
    public boolean isRigidMaterial() {
        return rigidMaterial;
    }
    
    public void setRigidMaterial(boolean rigidMaterial) {
        this.rigidMaterial = rigidMaterial;
    }
    
    public boolean isStandardMaterial() {
        return standardMaterial;
    }
    
    public void setStandardMaterial(boolean standardMaterial) {
        this.standardMaterial = standardMaterial;
    }
    
    public boolean isSpecialMaterial() {
        return specialMaterial;
    }
    
    public void setSpecialMaterial(boolean specialMaterial) {
        this.specialMaterial = specialMaterial;
    }
    
    public String getMaterialNotes() {
        return materialNotes;
    }
    
    public void setMaterialNotes(String materialNotes) {
        this.materialNotes = materialNotes;
    }
    
    public String getDesignNotes() {
        return designNotes;
    }
    
    public void setDesignNotes(String designNotes) {
        this.designNotes = designNotes;
    }
    
    public String getManufacturingNotes() {
        return manufacturingNotes;
    }
    
    public void setManufacturingNotes(String manufacturingNotes) {
        this.manufacturingNotes = manufacturingNotes;
    }
    
    public String getTestNotes() {
        return testNotes;
    }
    
    public void setTestNotes(String testNotes) {
        this.testNotes = testNotes;
    }
    
    public String getAssemblyNotes() {
        return assemblyNotes;
    }
    
    public void setAssemblyNotes(String assemblyNotes) {
        this.assemblyNotes = assemblyNotes;
    }
    
    public String getPackagingNotes() {
        return packagingNotes;
    }
    
    public void setPackagingNotes(String packagingNotes) {
        this.packagingNotes = packagingNotes;
    }
    
    public String getShippingNotes() {
        return shippingNotes;
    }
    
    public void setShippingNotes(String shippingNotes) {
        this.shippingNotes = shippingNotes;
    }
    
    public String getCostNotes() {
        return costNotes;
    }
    
    public void setCostNotes(String costNotes) {
        this.costNotes = costNotes;
    }
    
    public String getScheduleNotes() {
        return scheduleNotes;
    }
    
    public void setScheduleNotes(String scheduleNotes) {
        this.scheduleNotes = scheduleNotes;
    }
    
    public String getQualityNotes() {
        return qualityNotes;
    }
    
    public void setQualityNotes(String qualityNotes) {
        this.qualityNotes = qualityNotes;
    }
    
    public String getReliabilityNotes() {
        return reliabilityNotes;
    }
    
    public void setReliabilityNotes(String reliabilityNotes) {
        this.reliabilityNotes = reliabilityNotes;
    }
    
    public String getEnvironmentalNotes() {
        return environmentalNotes;
    }
    
    public void setEnvironmentalNotes(String environmentalNotes) {
        this.environmentalNotes = environmentalNotes;
    }
    
    public String getComplianceNotes() {
        return complianceNotes;
    }
    
    public void setComplianceNotes(String complianceNotes) {
        this.complianceNotes = complianceNotes;
    }
    
    public String getSafetyNotes() {
        return safetyNotes;
    }
    
    public void setSafetyNotes(String safetyNotes) {
        this.safetyNotes = safetyNotes;
    }
    
    public String getRegulatoryNotes() {
        return regulatoryNotes;
    }
    
    public void setRegulatoryNotes(String regulatoryNotes) {
        this.regulatoryNotes = regulatoryNotes;
    }
    
    public String getCustomerRequirements() {
        return customerRequirements;
    }
    
    public void setCustomerRequirements(String customerRequirements) {
        this.customerRequirements = customerRequirements;
    }
    
    public String getEngineeringRequirements() {
        return engineeringRequirements;
    }
    
    public void setEngineeringRequirements(String engineeringRequirements) {
        this.engineeringRequirements = engineeringRequirements;
    }
    
    public String getManufacturingRequirements() {
        return manufacturingRequirements;
    }
    
    public void setManufacturingRequirements(String manufacturingRequirements) {
        this.manufacturingRequirements = manufacturingRequirements;
    }
    
    public String getTestRequirements() {
        return testRequirements;
    }
    
    public void setTestRequirements(String testRequirements) {
        this.testRequirements = testRequirements;
    }
    
    public String getAssemblyRequirements() {
        return assemblyRequirements;
    }
    
    public void setAssemblyRequirements(String assemblyRequirements) {
        this.assemblyRequirements = assemblyRequirements;
    }
    
    public String getPackagingRequirements() {
        return packagingRequirements;
    }
    
    public void setPackagingRequirements(String packagingRequirements) {
        this.packagingRequirements = packagingRequirements;
    }
    
    public String getShippingRequirements() {
        return shippingRequirements;
    }
    
    public void setShippingRequirements(String shippingRequirements) {
        this.shippingRequirements = shippingRequirements;
    }
    
    public String getCostRequirements() {
        return costRequirements;
    }
    
    public void setCostRequirements(String costRequirements) {
        this.costRequirements = costRequirements;
    }
    
    public String getScheduleRequirements() {
        return scheduleRequirements;
    }
    
    public void setScheduleRequirements(String scheduleRequirements) {
        this.scheduleRequirements = scheduleRequirements;
    }
    
    public String getQualityRequirements() {
        return qualityRequirements;
    }
    
    public void setQualityRequirements(String qualityRequirements) {
        this.qualityRequirements = qualityRequirements;
    }
    
    public String getReliabilityRequirements() {
        return reliabilityRequirements;
    }
    
    public void setReliabilityRequirements(String reliabilityRequirements) {
        this.reliabilityRequirements = reliabilityRequirements;
    }
    
    public String getEnvironmentalRequirements() {
        return environmentalRequirements;
    }
    
    public void setEnvironmentalRequirements(String environmentalRequirements) {
        this.environmentalRequirements = environmentalRequirements;
    }
    
    public String getComplianceRequirements() {
        return complianceRequirements;
    }
    
    public void setComplianceRequirements(String complianceRequirements) {
        this.complianceRequirements = complianceRequirements;
    }
    
    public String getSafetyRequirements() {
        return safetyRequirements;
    }
    
    public void setSafetyRequirements(String safetyRequirements) {
        this.safetyRequirements = safetyRequirements;
    }
    
    public String getRegulatoryRequirements() {
        return regulatoryRequirements;
    }
    
    public void setRegulatoryRequirements(String regulatoryRequirements) {
        this.regulatoryRequirements = regulatoryRequirements;
    }
    
    public DFMStatus getStatus() {
        return status;
    }
    
    public void setStatus(DFMStatus status) {
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
    
    public UUID getRejectedBy() {
        return rejectedBy;
    }
    
    public void setRejectedBy(UUID rejectedBy) {
        this.rejectedBy = rejectedBy;
    }
    
    public String getRejectedByName() {
        return rejectedByName;
    }
    
    public void setRejectedByName(String rejectedByName) {
        this.rejectedByName = rejectedByName;
    }
    
    public OffsetDateTime getRejectedAt() {
        return rejectedAt;
    }
    
    public void setRejectedAt(OffsetDateTime rejectedAt) {
        this.rejectedAt = rejectedAt;
    }
    
    public String getRejectedReason() {
        return rejectedReason;
    }
    
    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }
    
    public Integer getVersion() {
        return version;
    }
    
    public void setVersion(Integer version) {
        this.version = version;
    }
    
    public boolean isLatest() {
        return isLatest;
    }
    
    public void setLatest(boolean latest) {
        isLatest = latest;
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