package com.pcbxpress.erp.modules.engineering.cam.repository;

import com.pcbxpress.erp.modules.engineering.cam.model.CamOutput;
import com.pcbxpress.erp.modules.engineering.cam.model.OutputStatus;
import com.pcbxpress.erp.modules.engineering.cam.model.OutputType;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CamOutputRepository extends JpaRepository<CamOutput, UUID> {
    
    List<CamOutput> findByCamJobIdOrderByCreatedAtDesc(UUID camJobId);
    
    List<CamOutput> findByCamJobIdAndOutputTypeOrderByCreatedAtDesc(UUID camJobId, OutputType outputType);
    
    List<CamOutput> findByCamJobIdAndStatusOrderByCreatedAtDesc(UUID camJobId, OutputStatus status);
    
    List<CamOutput> findByCreatedByOrderByCreatedAtDesc(UUID createdBy);
    
    List<CamOutput> findByOutputType(OutputType outputType);
    
    List<CamOutput> findByStatus(OutputStatus status);
    
    @Query("SELECT c FROM CamOutput c WHERE c.camJobId = :camJobId AND c.outputType = :outputType AND c.status = :status ORDER BY c.version DESC")
    List<CamOutput> findByCamJobIdOutputTypeAndStatusOrderByVersionDesc(
        @Param("camJobId") UUID camJobId,
        @Param("outputType") OutputType outputType,
        @Param("status") OutputStatus status
    );
    
    @Query("SELECT c FROM CamOutput c WHERE c.camJobId = :camJobId AND c.fileName = :fileName ORDER BY c.version DESC")
    List<CamOutput> findByCamJobIdAndFileNameOrderByVersionDesc(
        @Param("camJobId") UUID camJobId,
        @Param("fileName") String fileName
    );
    
    @Query("SELECT MAX(c.version) FROM CamOutput c WHERE c.camJobId = :camJobId AND c.outputType = :outputType")
    Integer findMaxVersionByCamJobIdAndOutputType(@Param("camJobId") UUID camJobId, @Param("outputType") OutputType outputType);
    
    long countByCamJobId(UUID camJobId);
    
    long countByOutputType(OutputType outputType);
    
    long countByStatus(OutputStatus status);
}