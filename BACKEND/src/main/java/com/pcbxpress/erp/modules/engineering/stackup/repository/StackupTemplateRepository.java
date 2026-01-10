package com.pcbxpress.erp.modules.engineering.stackup.repository;

import com.pcbxpress.erp.modules.engineering.stackup.model.StackupTemplate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StackupTemplateRepository extends JpaRepository<StackupTemplate, UUID> {
    
    List<StackupTemplate> findByNameContainingIgnoreCase(String name);
    
    List<StackupTemplate> findByMaterialTypeIgnoreCase(String materialType);
    
    List<StackupTemplate> findByLayerCount(Integer layerCount);
    
    List<StackupTemplate> findByIsActiveTrue();
    
    List<StackupTemplate> findByIsDefaultTrue();
    
    @Query("SELECT t FROM StackupTemplate t WHERE t.layerCount = :layerCount AND t.materialType = :materialType AND t.isActive = true")
    List<StackupTemplate> findByLayerCountAndMaterialType(@Param("layerCount") Integer layerCount, @Param("materialType") String materialType);
    
    @Query("SELECT t FROM StackupTemplate t WHERE t.impedanceControlled = true AND t.isActive = true")
    List<StackupTemplate> findImpedanceControlledTemplates();
    
    @Query("SELECT t FROM StackupTemplate t WHERE t.rigidFlex = true AND t.isActive = true")
    List<StackupTemplate> findRigidFlexTemplates();
    
    @Query("SELECT t FROM StackupTemplate t WHERE t.flexCable = true AND t.isActive = true")
    List<StackupTemplate> findFlexCableTemplates();
    
    @Query("SELECT t FROM StackupTemplate t WHERE t.metalCore = true AND t.isActive = true")
    List<StackupTemplate> findMetalCoreTemplates();
    
    @Query("SELECT t FROM StackupTemplate t WHERE t.ceramicSubstrate = true AND t.isActive = true")
    List<StackupTemplate> findCeramicSubstrateTemplates();
    
    @Query("SELECT t FROM StackupTemplate t WHERE t.highFreqMaterial = true AND t.isActive = true")
    List<StackupTemplate> findHighFreqMaterialTemplates();
    
    @Query("SELECT t FROM StackupTemplate t WHERE t.highTempMaterial = true AND t.isActive = true")
    List<StackupTemplate> findHighTempMaterialTemplates();
    
    long countByIsActiveTrue();
    
    long countByIsDefaultTrue();
    
    long countByMaterialType(String materialType);
    
    long countByLayerCount(Integer layerCount);
}