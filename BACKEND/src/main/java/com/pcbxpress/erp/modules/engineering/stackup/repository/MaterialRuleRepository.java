package com.pcbxpress.erp.modules.engineering.stackup.repository;

import com.pcbxpress.erp.modules.engineering.stackup.model.MaterialRule;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MaterialRuleRepository extends JpaRepository<MaterialRule, UUID> {
    
    List<MaterialRule> findByMaterialTypeIgnoreCase(String materialType);
    
    List<MaterialRule> findByRuleTypeIgnoreCase(String ruleType);
    
    List<MaterialRule> findByRuleNameContainingIgnoreCase(String ruleName);
    
    List<MaterialRule> findByIsActiveTrue();
    
    List<MaterialRule> findByIsDefaultTrue();
    
    @Query("SELECT r FROM MaterialRule r WHERE r.materialType = :materialType AND r.ruleType = :ruleType AND r.isActive = true")
    List<MaterialRule> findByMaterialTypeAndRuleType(@Param("materialType") String materialType, @Param("ruleType") String ruleType);
    
    @Query("SELECT r FROM MaterialRule r WHERE r.impedanceControlled = true AND r.isActive = true")
    List<MaterialRule> findImpedanceControlledRules();
    
    @Query("SELECT r FROM MaterialRule r WHERE r.rigidFlex = true AND r.isActive = true")
    List<MaterialRule> findRigidFlexRules();
    
    @Query("SELECT r FROM MaterialRule r WHERE r.flexCable = true AND r.isActive = true")
    List<MaterialRule> findFlexCableRules();
    
    @Query("SELECT r FROM MaterialRule r WHERE r.metalCore = true AND r.isActive = true")
    List<MaterialRule> findMetalCoreRules();
    
    @Query("SELECT r FROM MaterialRule r WHERE r.ceramicSubstrate = true AND r.isActive = true")
    List<MaterialRule> findCeramicSubstrateRules();
    
    @Query("SELECT r FROM MaterialRule r WHERE r.highFreqMaterial = true AND r.isActive = true")
    List<MaterialRule> findHighFreqMaterialRules();
    
    @Query("SELECT r FROM MaterialRule r WHERE r.highTempMaterial = true AND r.isActive = true")
    List<MaterialRule> findHighTempMaterialRules();
    
    @Query("SELECT r FROM MaterialRule r WHERE r.layerCountMin <= :layerCount AND r.layerCountMax >= :layerCount AND r.isActive = true")
    List<MaterialRule> findByLayerCountRange(@Param("layerCount") Integer layerCount);
    
    @Query("SELECT r FROM MaterialRule r WHERE r.thicknessMin <= :thickness AND r.thicknessMax >= :thickness AND r.isActive = true")
    List<MaterialRule> findByThicknessRange(@Param("thickness") Double thickness);
    
    @Query("SELECT r FROM MaterialRule r WHERE r.copperThicknessMin <= :copperThickness AND r.copperThicknessMax >= :copperThickness AND r.isActive = true")
    List<MaterialRule> findByCopperThicknessRange(@Param("copperThickness") Double copperThickness);
    
    long countByIsActiveTrue();
    
    long countByIsDefaultTrue();
    
    long countByMaterialType(String materialType);
    
    long countByRuleType(String ruleType);
}