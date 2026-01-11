package com.pcbxpress.erp.modules.procurement.grn.repository;

import com.pcbxpress.erp.modules.procurement.grn.model.Grn;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GrnRepository extends JpaRepository<Grn, UUID> {

    Optional<Grn> findByGrnNumber(String grnNumber);
    
    List<Grn> findByPoId(UUID poId);
    
    List<Grn> findBySupplierId(UUID supplierId);
    
    List<Grn> findByWarehouseId(UUID warehouseId);
    
    List<Grn> findByStatus(String status);
    
    List<Grn> findByReceivedAtBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    @Query("SELECT grn FROM Grn grn WHERE " +
           "LOWER(grn.grnNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(grn.poNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(grn.supplierName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(grn.warehouseName) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Grn> findByQuery(@Param("query") String query);
    
    @Query("SELECT grn FROM Grn grn WHERE " +
           "(:status IS NULL OR LOWER(grn.status) = LOWER(:status)) AND " +
           "(LOWER(grn.grnNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(grn.poNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(grn.supplierName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(grn.warehouseName) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Grn> findByStatusAndQuery(@Param("status") String status, 
                                 @Param("query") String query, 
                                 Pageable pageable);
    
    @Query("SELECT grn FROM Grn grn WHERE grn.status IN :statuses")
    List<Grn> findByStatusIn(@Param("statuses") List<String> statuses);
    
    @Query("SELECT grn FROM Grn grn WHERE grn.receivedAt >= :fromDate AND grn.receivedAt <= :toDate")
    List<Grn> findByReceivedDateRange(@Param("fromDate") OffsetDateTime fromDate, 
                                    @Param("toDate") OffsetDateTime toDate);
    
    @Query("SELECT grn FROM Grn grn WHERE grn.qcRequired = true AND grn.qcPassedAt IS NULL AND grn.qcFailedAt IS NULL")
    List<Grn> findQcPending();
    
    @Query("SELECT grn FROM Grn grn WHERE grn.qcRequired = true AND grn.qcPassedAt IS NOT NULL")
    List<Grn> findQcPassed();
    
    @Query("SELECT grn FROM Grn grn WHERE grn.qcRequired = true AND grn.qcFailedAt IS NOT NULL")
    List<Grn> findQcFailed();
    
    @Query("SELECT grn FROM Grn grn WHERE grn.putawayCompletedAt IS NULL AND grn.status = 'QC_PASSED'")
    List<Grn> findPendingPutaway();
    
    @Query("SELECT grn FROM Grn grn WHERE grn.poId = :poId AND grn.status = 'RECEIVED'")
    List<Grn> findReceivedByPoId(@Param("poId") UUID poId);
}