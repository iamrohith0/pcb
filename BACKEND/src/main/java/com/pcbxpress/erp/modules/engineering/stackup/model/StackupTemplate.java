package com.pcbxpress.erp.modules.engineering.stackup.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "stackup_templates", indexes = {
    @Index(name = "idx_stackup_templates_name", columnList = "name"),
    @Index(name = "idx_stackup_templates_layer_count", columnList = "layerCount"),
    @Index(name = "idx_stackup_templates_material_type", columnList = "materialType"),
    @Index(name = "idx_stackup_templates_created_at", columnList = "createdAt"),
    @Index(name = "idx_stackup_templates_updated_at", columnList = "updatedAt")
})
public class StackupTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(name = "description", columnDefinition = "text")
    private String description;
    
    @Column(name = "layer_count")
    private Integer layerCount;
    
    @Column(name = "total_thickness")
    private Double totalThickness;
    
    @Column(name = "copper_thickness")
    private Double copperThickness;
    
    @Column(name = "material_type", length = 100)
    private String materialType;
    
    @Column(name = "dielectric_constant")
    private Double dielectricConstant;
    
    @Column(name = "dissipation_factor")
    private Double dissipationFactor;
    
    @Column(name = "glass_weave_type", length = 50)
    private String glassWeaveType;
    
    @Column(name = "glass_weave_style", length = 50)
    private String glassWeaveStyle;
    
    @Column(name = "prepreg_type", length = 100)
    private String prepregType;
    
    @Column(name = "prepreg_thickness")
    private Double prepregThickness;
    
    @Column(name = "core_type", length = 100)
    private String coreType;
    
    @Column(name = "core_thickness")
    private Double coreThickness;
    
    @Column(name = "solder_mask_thickness")
    private Double solderMaskThickness;
    
    @Column(name = "legend_thickness")
    private Double legendThickness;
    
    @Column(name = "surface_finish", length = 50)
    private String surfaceFinish;
    
    @Column(name = "impedance_controlled", nullable = false)
    private boolean impedanceControlled;
    
    @Column(name = "controlled_impedance_layers", length = 200)
    private String controlledImpedanceLayers;
    
    @Column(name = "target_impedance")
    private Double targetImpedance;
    
    @Column(name = "impedance_tolerance")
    private Double impedanceTolerance;
    
    @Column(name = "trace_width")
    private Double traceWidth;
    
    @Column(name = "trace_spacing")
    private Double traceSpacing;
    
    @Column(name = "via_size")
    private Double viaSize;
    
    @Column(name = "via_pad_size")
    private Double viaPadSize;
    
    @Column(name = "via_clearance")
    private Double viaClearance;
    
    @Column(name = "microvia_size")
    private Double microviaSize;
    
    @Column(name = "microvia_pad_size")
    private Double microviaPadSize;
    
    @Column(name = "blind_via_size")
    private Double blindViaSize;
    
    @Column(name = "buried_via_size")
    private Double buriedViaSize;
    
    @Column(name = "laser_via_size")
    private Double laserViaSize;
    
    @Column(name = "backdrill_size")
    private Double backdrillSize;
    
    @Column(name = "plated_holes", nullable = false)
    private boolean platedHoles;
    
    @Column(name = "non_plated_holes", nullable = false)
    private boolean nonPlatedHoles;
    
    @Column(name = "castellated_holes", nullable = false)
    private boolean castellatedHoles;
    
    @Column(name = "edge_plating", nullable = false)
    private boolean edgePlating;
    
    @Column(name = "rigid_flex", nullable = false)
    private boolean rigidFlex;
    
    @Column(name = "flex_rigid", nullable = false)
    private boolean flexRigid;
    
    @Column(name = "flex_cable", nullable = false)
    private boolean flexCable;
    
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
    
    @Column(name = "notes", columnDefinition = "text")
    private String notes;
    
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
    
    public Double getTotalThickness() {
        return totalThickness;
    }
    
    public void setTotalThickness(Double totalThickness) {
        this.totalThickness = totalThickness;
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
    
    public Double getDielectricConstant() {
        return dielectricConstant;
    }
    
    public void setDielectricConstant(Double dielectricConstant) {
        this.dielectricConstant = dielectricConstant;
    }
    
    public Double getDissipationFactor() {
        return dissipationFactor;
    }
    
    public void setDissipationFactor(Double dissipationFactor) {
        this.dissipationFactor = dissipationFactor;
    }
    
    public String getGlassWeaveType() {
        return glassWeaveType;
    }
    
    public void setGlassWeaveType(String glassWeaveType) {
        this.glassWeaveType = glassWeaveType;
    }
    
    public String getGlassWeaveStyle() {
        return glassWeaveStyle;
    }
    
    public void setGlassWeaveStyle(String glassWeaveStyle) {
        this.glassWeaveStyle = glassWeaveStyle;
    }
    
    public String getPrepregType() {
        return prepregType;
    }
    
    public void setPrepregType(String prepregType) {
        this.prepregType = prepregType;
    }
    
    public Double getPrepregThickness() {
        return prepregThickness;
    }
    
    public void setPrepregThickness(Double prepregThickness) {
        this.prepregThickness = prepregThickness;
    }
    
    public String getCoreType() {
        return coreType;
    }
    
    public void setCoreType(String coreType) {
        this.coreType = coreType;
    }
    
    public Double getCoreThickness() {
        return coreThickness;
    }
    
    public void setCoreThickness(Double coreThickness) {
        this.coreThickness = coreThickness;
    }
    
    public Double getSolderMaskThickness() {
        return solderMaskThickness;
    }
    
    public void setSolderMaskThickness(Double solderMaskThickness) {
        this.solderMaskThickness = solderMaskThickness;
    }
    
    public Double getLegendThickness() {
        return legendThickness;
    }
    
    public void setLegendThickness(Double legendThickness) {
        this.legendThickness = legendThickness;
    }
    
    public String getSurfaceFinish() {
        return surfaceFinish;
    }
    
    public void setSurfaceFinish(String surfaceFinish) {
        this.surfaceFinish = surfaceFinish;
    }
    
    public boolean isImpedanceControlled() {
        return impedanceControlled;
    }
    
    public void setImpedanceControlled(boolean impedanceControlled) {
        this.impedanceControlled = impedanceControlled;
    }
    
    public String getControlledImpedanceLayers() {
        return controlledImpedanceLayers;
    }
    
    public void setControlledImpedanceLayers(String controlledImpedanceLayers) {
        this.controlledImpedanceLayers = controlledImpedanceLayers;
    }
    
    public Double getTargetImpedance() {
        return targetImpedance;
    }
    
    public void setTargetImpedance(Double targetImpedance) {
        this.targetImpedance = targetImpedance;
    }
    
    public Double getImpedanceTolerance() {
        return impedanceTolerance;
    }
    
    public void setImpedanceTolerance(Double impedanceTolerance) {
        this.impedanceTolerance = impedanceTolerance;
    }
    
    public Double getTraceWidth() {
        return traceWidth;
    }
    
    public void setTraceWidth(Double traceWidth) {
        this.traceWidth = traceWidth;
    }
    
    public Double getTraceSpacing() {
        return traceSpacing;
    }
    
    public void setTraceSpacing(Double traceSpacing) {
        this.traceSpacing = traceSpacing;
    }
    
    public Double getViaSize() {
        return viaSize;
    }
    
    public void setViaSize(Double viaSize) {
        this.viaSize = viaSize;
    }
    
    public Double getViaPadSize() {
        return viaPadSize;
    }
    
    public void setViaPadSize(Double viaPadSize) {
        this.viaPadSize = viaPadSize;
    }
    
    public Double getViaClearance() {
        return viaClearance;
    }
    
    public void setViaClearance(Double viaClearance) {
        this.viaClearance = viaClearance;
    }
    
    public Double getMicroviaSize() {
        return microviaSize;
    }
    
    public void setMicroviaSize(Double microviaSize) {
        this.microviaSize = microviaSize;
    }
    
    public Double getMicroviaPadSize() {
        return microviaPadSize;
    }
    
    public void setMicroviaPadSize(Double microviaPadSize) {
        this.microviaPadSize = microviaPadSize;
    }
    
    public Double getBlindViaSize() {
        return blindViaSize;
    }
    
    public void setBlindViaSize(Double blindViaSize) {
        this.blindViaSize = blindViaSize;
    }
    
    public Double getBuriedViaSize() {
        return buriedViaSize;
    }
    
    public void setBuriedViaSize(Double buriedViaSize) {
        this.buriedViaSize = buriedViaSize;
    }
    
    public Double getLaserViaSize() {
        return laserViaSize;
    }
    
    public void setLaserViaSize(Double laserViaSize) {
        this.laserViaSize = laserViaSize;
    }
    
    public Double getBackdrillSize() {
        return backdrillSize;
    }
    
    public void setBackdrillSize(Double backdrillSize) {
        this.backdrillSize = backdrillSize;
    }
    
    public boolean isPlatedHoles() {
        return platedHoles;
    }
    
    public void setPlatedHoles(boolean platedHoles) {
        this.platedHoles = platedHoles;
    }
    
    public boolean isNonPlatedHoles() {
        return nonPlatedHoles;
    }
    
    public void setNonPlatedHoles(boolean nonPlatedHoles) {
        this.nonPlatedHoles = nonPlatedHoles;
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
    
    public boolean isRigidFlex() {
        return rigidFlex;
    }
    
    public void setRigidFlex(boolean rigidFlex) {
        this.rigidFlex = rigidFlex;
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
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
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