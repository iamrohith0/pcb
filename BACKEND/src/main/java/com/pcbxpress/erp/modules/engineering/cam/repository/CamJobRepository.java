package com.pcbxpress.erp.modules.engineering.cam.repository;

import com.pcbxpress.erp.modules.engineering.cam.model.CamJob;
import com.pcbxpress.erp.modules.engineering.cam.model.CamJobStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CamJobRepository extends JpaRepository<CamJob, UUID> {
    
    List<CamJob> findByStatus(CamJobStatus status);
    
    List<CamJob> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);
    
    List<CamJob> findByJobNumberContainingIgnoreCase(String jobNumber);
    
    List<CamJob> findByPartNumberContainingIgnoreCase(String partNumber);
    
    List<CamJob> findByCustomerNameContainingIgnoreCase(String customerName);
    
    @Query("SELECT c FROM CamJob c WHERE c.status IN :statuses ORDER BY c.createdAt DESC")
    List<CamJob> findByStatusIn(@Param("statuses") List<CamJobStatus> statuses);
    
    @Query("SELECT c FROM CamJob c WHERE c.assignedTo = :userId AND c.status NOT IN :completedStatuses ORDER BY c.updatedAt DESC")
    List<CamJob> findByAssignedToAndNotCompleted(@Param("userId") UUID userId, @Param("completedStatuses") List<CamJobStatus> completedStatuses);
    
    @Query("SELECT c FROM CamJob c WHERE c.priority = :priority AND c.status NOT IN :completedStatuses ORDER BY c.createdAt DESC")
    List<CamJob> findByPriorityAndNotCompleted(@Param("priority") String priority, @Param("completedStatuses") List<CamJobStatus> completedStatuses);
    
    long countByStatus(CamJobStatus status);
    
    long countByStatusIn(List<CamJobStatus> statuses);
}