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
@Table(name = "material_rules", indexes = {
    @Index(name = "idx_material_rules_material_type", columnList = "materialType"),
    @Index(name = "idx_material_rules_rule_type", columnList = "ruleType"),
    @Index(name = "idx_material_rules_created_at", columnList = "createdAt"),
    @Index(name = "idx_material_rules_updated_at", columnList = "updatedAt")
})
public class MaterialRule {
    
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(nullable = false, columnDefinition = "uuid")
    private UUID id;
    
    @Column(name = "material_type", nullable = false, length = 100)
    private String materialType;
    
    @Column(name = "rule_type", nullable = false, length = 50)
    private String ruleType;
    
    @Column(name = "rule_name", nullable = false, length = 100)
    private String ruleName;
    
    @Column(name = "rule_description", columnDefinition = "text")
    private String ruleDescription;
    
    @Column(name = "min_value")
    private Double minValue;
    
    @Column(name = "max_value")
    private Double maxValue;
    
    @Column(name = "target_value")
    private Double targetValue;
    
    @Column(name = "tolerance")
    private Double tolerance;
    
    @Column(name = "unit", length = 20)
    private String unit;
    
    @Column(name = "layer_count_min")
    private Integer layerCountMin;
    
    @Column(name = "layer_count_max")
    private Integer layerCountMax;
    
    @Column(name = "thickness_min")
    private Double thicknessMin;
    
    @Column(name = "thickness_max")
    private Double thicknessMax;
    
    @Column(name = "copper_thickness_min")
    private Double copperThicknessMin;
    
    @Column(name = "copper_thickness_max")
    private Double copperThicknessMax;
    
    @Column(name = "dielectric_constant_min")
    private Double dielectricConstantMin;
    
    @Column(name = "dielectric_constant_max")
    private Double dielectricConstantMax;
    
    @Column(name = "dissipation_factor_min")
    private Double dissipationFactorMin;
    
    @Column(name = "dissipation_factor_max")
    private Double dissipationFactorMax;
    
    @Column(name = "glass_weave_type", length = 50)
    private String glassWeaveType;
    
    @Column(name = "glass_weave_style", length = 50)
    private String glassWeaveStyle;
    
    @Column(name = "prepreg_type", length = 100)
    private String prepregType;
    
    @Column(name = "core_type", length = 100)
    private String coreType;
    
    @Column(name = "surface_finish", length = 50)
    private String surfaceFinish;
    
    @Column(name = "impedance_controlled", nullable = false)
    private boolean impedanceControlled;
    
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
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive;
    
    @Column(name = "is_default", nullable = false)
    private boolean isDefault;
    
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
    
    public String getMaterialType() {
        return materialType;
    }
    
    public void setMaterialType(String materialType) {
        this.materialType = materialType;
    }
    
    public String getRuleType() {
        return ruleType;
    }
    
    public void setRuleType(String ruleType) {
        this.ruleType = ruleType;
    }
    
    public String getRuleName() {
        return ruleName;
    }
    
    public void setRuleName(String ruleName) {
        this.ruleName = ruleName;
    }
    
    public String getRuleDescription() {
        return ruleDescription;
    }
    
    public void setRuleDescription(String ruleDescription) {
        this.ruleDescription = ruleDescription;
    }
    
    public Double getMinValue() {
        return minValue;
    }
    
    public void setMinValue(Double minValue) {
        this.minValue = minValue;
    }
    
    public Double getMaxValue() {
        return maxValue;
    }
    
    public void setMaxValue(Double maxValue) {
        this.maxValue = maxValue;
    }
    
    public Double getTargetValue() {
        return targetValue;
    }
    
    public void setTargetValue(Double targetValue) {
        this.targetValue = targetValue;
    }
    
    public Double getTolerance() {
        return tolerance;
    }
    
    public void setTolerance(Double tolerance) {
        this.tolerance = tolerance;
    }
    
    public String getUnit() {
        return unit;
    }
    
    public void setUnit(String unit) {
        this.unit = unit;
    }
    
    public Integer getLayerCountMin() {
        return layerCountMin;
    }
    
    public void setLayerCountMin(Integer layerCountMin) {
        this.layerCountMin = layerCountMin;
    }
    
    public Integer getLayerCountMax() {
        return layerCountMax;
    }
    
    public void setLayerCountMax(Integer layerCountMax) {
        this.layerCountMax = layerCountMax;
    }
    
    public Double getThicknessMin() {
        return thicknessMin;
    }
    
    public void setThicknessMin(Double thicknessMin) {
        this.thicknessMin = thicknessMin;
    }
    
    public Double getThicknessMax() {
        return thicknessMax;
    }
    
    public void setThicknessMax(Double thicknessMax) {
        this.thicknessMax = thicknessMax;
    }
    
    public Double getCopperThicknessMin() {
        return copperThicknessMin;
    }
    
    public void setCopperThicknessMin(Double copperThicknessMin) {
        this.copperThicknessMin = copperThicknessMin;
    }
    
    public Double getCopperThicknessMax() {
        return copperThicknessMax;
    }
    
    public void setCopperThicknessMax(Double copperThicknessMax) {
        this.copperThicknessMax = copperThicknessMax;
    }
    
    public Double getDielectricConstantMin() {
        return dielectricConstantMin;
    }
    
    public void setDielectricConstantMin(Double dielectricConstantMin) {
        this.dielectricConstantMin = dielectricConstantMin;
    }
    
    public Double getDielectricConstantMax() {
        return dielectricConstantMax;
    }
    
    public void setDielectricConstantMax(Double dielectricConstantMax) {
        this.dielectricConstantMax = dielectricConstantMax;
    }
    
    public Double getDissipationFactorMin() {
        return dissipationFactorMin;
    }
    
    public void setDissipationFactorMin(Double dissipationFactorMin) {
        this.dissipationFactorMin = dissipationFactorMin;
    }
    
    public Double getDissipationFactorMax() {
        return dissipationFactorMax;
    }
    
    public void setDissipationFactorMax(Double dissipationFactorMax) {
        this.dissipationFactorMax = dissipationFactorMax;
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
    
    public String getCoreType() {
        return coreType;
    }
    
    public void setCoreType(String coreType) {
        this.coreType = coreType;
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