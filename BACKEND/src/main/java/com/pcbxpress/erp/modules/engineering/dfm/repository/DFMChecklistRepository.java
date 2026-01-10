package com.pcbxpress.erp.modules.engineering.dfm.repository;

import com.pcbxpress.erp.modules.engineering.dfm.model.DFMChecklist;
import com.pcbxpress.erp.modules.engineering.dfm.model.DFMStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DFMChecklistRepository extends JpaRepository<DFMChecklist, UUID> {
    
    List<DFMChecklist> findByJobIdOrderByCreatedAtDesc(UUID jobId);
    
    List<DFMChecklist> findByJobIdAndStatusOrderByCreatedAtDesc(UUID jobId, DFMStatus status);
    
    List<DFMChecklist> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    
    List<DFMChecklist> findByStatusOrderByCreatedAtDesc(DFMStatus status);
    
    List<DFMChecklist> findByCreatedByOrderByCreatedAtDesc(UUID createdBy);
    
    List<DFMChecklist> findByIsLatestTrue();
    
    List<DFMChecklist> findByIsLatestTrueAndJobId(UUID jobId);
    
    List<DFMChecklist> findByIsLatestTrueAndCustomerId(UUID customerId);
    
    List<DFMChecklist> findByIsLatestTrueAndStatus(DFMStatus status);
    
    @Query("SELECT c FROM DFMChecklist c WHERE c.jobId = :jobId AND c.isLatest = true ORDER BY c.version DESC")
    List<DFMChecklist> findLatestByJobId(@Param("jobId") UUID jobId);
    
    @Query("SELECT c FROM DFMChecklist c WHERE c.jobId = :jobId AND c.version = (SELECT MAX(c2.version) FROM DFMChecklist c2 WHERE c2.jobId = :jobId)")
    DFMChecklist findLatestVersionByJobId(@Param("jobId") UUID jobId);
    
    @Query("SELECT c FROM DFMChecklist c WHERE c.jobId = :jobId AND c.status IN :statuses ORDER BY c.createdAt DESC")
    List<DFMChecklist> findByJobIdAndStatusIn(@Param("jobId") UUID jobId, @Param("statuses") List<DFMStatus> statuses);
    
    @Query("SELECT c FROM DFMChecklist c WHERE c.customerId = :customerId AND c.status IN :statuses ORDER BY c.createdAt DESC")
    List<DFMChecklist> findByCustomerIdAndStatusIn(@Param("customerId") UUID customerId, @Param("statuses") List<DFMStatus> statuses);
    
    @Query("SELECT c FROM DFMChecklist c WHERE c.createdBy = :userId AND c.status NOT IN :completedStatuses ORDER BY c.updatedAt DESC")
    List<DFMChecklist> findByCreatedByAndNotCompleted(@Param("userId") UUID userId, @Param("completedStatuses") List<DFMStatus> completedStatuses);
    
    long countByJobId(UUID jobId);
    
    long countByStatus(DFMStatus status);
    
    long countByIsLatestTrue();
    
    long countByIsLatestTrueAndJobId(UUID jobId);
    
    long countByIsLatestTrueAndCustomerId(UUID customerId);
    
    long countByIsLatestTrueAndStatus(DFMStatus status);
}