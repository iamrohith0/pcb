package com.pcbxpress.erp.modules.engineering.panelization.repository;

import com.pcbxpress.erp.modules.engineering.panelization.model.PanelTemplate;
import com.pcbxpress.erp.modules.engineering.panelization.model.PanelStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PanelTemplateRepository extends JpaRepository<PanelTemplate, UUID> {
    
    List<PanelTemplate> findByNameContainingIgnoreCase(String name);
    
    List<PanelTemplate> findByJobIdOrderByCreatedAtDesc(UUID jobId);
    
    List<PanelTemplate> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    
    List<PanelTemplate> findByStatusOrderByCreatedAtDesc(PanelStatus status);
    
    List<PanelTemplate> findByIsActiveTrue();
    
    List<PanelTemplate> findByIsDefaultTrue();
    
    @Query("SELECT t FROM PanelTemplate t WHERE t.jobId = :jobId AND t.status = :status AND t.isActive = true")
    List<PanelTemplate> findByJobIdAndStatus(@Param("jobId") UUID jobId, @Param("status") PanelStatus status);
    
    @Query("SELECT t FROM PanelTemplate t WHERE t.panelType = :panelType AND t.isActive = true")
    List<PanelTemplate> findByPanelType(@Param("panelType") String panelType);
    
    @Query("SELECT t FROM PanelTemplate t WHERE t.panelizationStyle = :panelizationStyle AND t.isActive = true")
    List<PanelTemplate> findByPanelizationStyle(@Param("panelizationStyle") String panelizationStyle);
    
    @Query("SELECT t FROM PanelTemplate t WHERE t.vScore = true AND t.isActive = true")
    List<PanelTemplate> findVScoreTemplates();
    
    @Query("SELECT t FROM PanelTemplate t WHERE t.tabRout = true AND t.isActive = true")
    List<PanelTemplate> findTabRoutTemplates();
    
    @Query("SELECT t FROM PanelTemplate t WHERE t.castellatedHoles = true AND t.isActive = true")
    List<PanelTemplate> findCastellatedHoleTemplates();
    
    @Query("SELECT t FROM PanelTemplate t WHERE t.edgePlating = true AND t.isActive = true")
    List<PanelTemplate> findEdgePlatingTemplates();
    
    long countByIsActiveTrue();
    
    long countByIsDefaultTrue();
    
    long countByJobId(UUID jobId);
    
    long countByCustomerId(UUID customerId);
}