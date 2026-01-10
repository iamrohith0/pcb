package com.pcbxpress.erp.modules.engineering.revisions.repository;

import com.pcbxpress.erp.modules.engineering.revisions.model.ECOChangeRequest;
import com.pcbxpress.erp.modules.engineering.revisions.model.ECOStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ECOChangeRequestRepository extends JpaRepository<ECOChangeRequest, UUID> {
    
    List<ECOChangeRequest> findByChangeRequestNumberContainingIgnoreCase(String changeRequestNumber);
    
    List<ECOChangeRequest> findByJobId(UUID jobId);
    
    List<ECOChangeRequest> findByJobNumber(String jobNumber);
    
    List<ECOChangeRequest> findByPartNumber(String partNumber);
    
    List<ECOChangeRequest> findByStatus(ECOStatus status);
    
    List<ECOChangeRequest> findByStatusIn(List<ECOStatus> statuses);
    
    List<ECOChangeRequest> findByRequestedBy(UUID requestedBy);
    
    List<ECOChangeRequest> findByAssignedTo(UUID assignedTo);
    
    List<ECOChangeRequest> findByPriority(String priority);
    
    List<ECOChangeRequest> findByChangeType(String changeType);
    
    List<ECOChangeRequest> findByCreatedAtBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<ECOChangeRequest> findByDueDateBefore(OffsetDateTime dueDate);
    
    List<ECOChangeRequest> findByDueDateAfter(OffsetDateTime dueDate);
    
    List<ECOChangeRequest> findByIsActiveTrue();
    
    List<ECOChangeRequest> findByIsActiveFalse();
    
    @Query("SELECT e FROM ECOChangeRequest e WHERE e.status IN :statuses AND e.dueDate < :date")
    List<ECOChangeRequest> findOverdueRequests(@Param("statuses") List<ECOStatus> statuses, @Param("date") OffsetDateTime date);
    
    @Query("SELECT e FROM ECOChangeRequest e WHERE e.status = :status AND e.createdAt >= :date")
    List<ECOChangeRequest> findRecentRequests(@Param("status") ECOStatus status, @Param("date") OffsetDateTime date);
    
    @Query("SELECT e FROM ECOChangeRequest e WHERE e.estimatedCost > :minCost AND e.estimatedCost < :maxCost")
    List<ECOChangeRequest> findByEstimatedCostBetween(@Param("minCost") Double minCost, @Param("maxCost") Double maxCost);
    
    @Query("SELECT e FROM ECOChangeRequest e WHERE e.estimatedHours > :minHours AND e.estimatedHours < :maxHours")
    List<ECOChangeRequest> findByEstimatedHoursBetween(@Param("minHours") Double minHours, @Param("maxHours") Double maxHours);
    
    @Query("SELECT e FROM ECOChangeRequest e WHERE e.approvedAt IS NOT NULL AND e.approvedAt >= :startDate AND e.approvedAt <= :endDate")
    List<ECOChangeRequest> findApprovedRequestsInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT e FROM ECOChangeRequest e WHERE e.rejectedAt IS NOT NULL AND e.rejectedAt >= :startDate AND e.rejectedAt <= :endDate")
    List<ECOChangeRequest> findRejectedRequestsInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT e FROM ECOChangeRequest e WHERE e.closedAt IS NOT NULL AND e.closedAt >= :startDate AND e.closedAt <= :endDate")
    List<ECOChangeRequest> findClosedRequestsInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT COUNT(e) FROM ECOChangeRequest e WHERE e.status = :status")
    long countByStatus(@Param("status") ECOStatus status);
    
    @Query("SELECT COUNT(e) FROM ECOChangeRequest e WHERE e.isActive = true")
    long countActive();
    
    @Query("SELECT COUNT(e) FROM ECOChangeRequest e WHERE e.isActive = false")
    long countInactive();
    
    @Query("SELECT COUNT(e) FROM ECOChangeRequest e WHERE e.createdAt >= :startDate AND e.createdAt <= :endDate")
    long countCreatedInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT COUNT(e) FROM ECOChangeRequest e WHERE e.approvedAt >= :startDate AND e.approvedAt <= :endDate")
    long countApprovedInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT COUNT(e) FROM ECOChangeRequest e WHERE e.rejectedAt >= :startDate AND e.rejectedAt <= :endDate")
    long countRejectedInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT COUNT(e) FROM ECOChangeRequest e WHERE e.closedAt >= :startDate AND e.closedAt <= :endDate")
    long countClosedInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT e FROM ECOChangeRequest e WHERE e.changeRequestNumber = :number AND e.id != :id")
    ECOChangeRequest findByChangeRequestNumberAndIdNot(@Param("number") String number, @Param("id") UUID id);
}