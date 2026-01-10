package com.pcbxpress.erp.modules.engineering.revisions.repository;

import com.pcbxpress.erp.modules.engineering.revisions.model.Revision;
import com.pcbxpress.erp.modules.engineering.revisions.model.RevisionStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RevisionRepository extends JpaRepository<Revision, UUID> {
    
    List<Revision> findByJobId(UUID jobId);
    
    List<Revision> findByJobNumber(String jobNumber);
    
    List<Revision> findByPartNumber(String partNumber);
    
    List<Revision> findByRevision(String revision);
    
    List<Revision> findByStatus(RevisionStatus status);
    
    List<Revision> findByStatusIn(List<RevisionStatus> statuses);
    
    List<Revision> findByChangeRequestId(UUID changeRequestId);
    
    List<Revision> findByChangeRequestNumber(String changeRequestNumber);
    
    List<Revision> findByApprovedBy(UUID approvedBy);
    
    List<Revision> findByPreviousRevision(String previousRevision);
    
    List<Revision> findByNextRevision(String nextRevision);
    
    List<Revision> findByRevisionDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<Revision> findByEffectiveDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<Revision> findByCreatedAtBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<Revision> findByIsActiveTrue();
    
    List<Revision> findByIsActiveFalse();
    
    @Query("SELECT r FROM Revision r WHERE r.partNumber = :partNumber AND r.revision = :revision AND r.id != :id")
    Revision findByPartNumberAndRevisionAndIdNot(@Param("partNumber") String partNumber, @Param("revision") String revision, @Param("id") UUID id);
    
    @Query("SELECT r FROM Revision r WHERE r.partNumber = :partNumber ORDER BY r.revisionDate DESC")
    List<Revision> findByPartNumberOrderByRevisionDateDesc(@Param("partNumber") String partNumber);
    
    @Query("SELECT r FROM Revision r WHERE r.partNumber = :partNumber AND r.status = :status ORDER BY r.revisionDate DESC")
    List<Revision> findByPartNumberAndStatusOrderByRevisionDateDesc(@Param("partNumber") String partNumber, @Param("status") RevisionStatus status);
    
    @Query("SELECT r FROM Revision r WHERE r.jobId = :jobId AND r.status = :status ORDER BY r.revisionDate DESC")
    List<Revision> findByJobIdAndStatusOrderByRevisionDateDesc(@Param("jobId") UUID jobId, @Param("status") RevisionStatus status);
    
    @Query("SELECT r FROM Revision r WHERE r.changeRequestId = :changeRequestId ORDER BY r.createdAt DESC")
    List<Revision> findByChangeRequestIdOrderByCreatedAtDesc(@Param("changeRequestId") UUID changeRequestId);
    
    @Query("SELECT r FROM Revision r WHERE r.approvedAt IS NOT NULL AND r.approvedAt >= :startDate AND r.approvedAt <= :endDate")
    List<Revision> findApprovedRevisionsInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT r FROM Revision r WHERE r.effectiveDate IS NOT NULL AND r.effectiveDate >= :startDate AND r.effectiveDate <= :endDate")
    List<Revision> findEffectiveRevisionsInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT COUNT(r) FROM Revision r WHERE r.status = :status")
    long countByStatus(@Param("status") RevisionStatus status);
    
    @Query("SELECT COUNT(r) FROM Revision r WHERE r.isActive = true")
    long countActive();
    
    @Query("SELECT COUNT(r) FROM Revision r WHERE r.isActive = false")
    long countInactive();
    
    @Query("SELECT COUNT(r) FROM Revision r WHERE r.createdAt >= :startDate AND r.createdAt <= :endDate")
    long countCreatedInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT COUNT(r) FROM Revision r WHERE r.approvedAt >= :startDate AND r.approvedAt <= :endDate")
    long countApprovedInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT COUNT(r) FROM Revision r WHERE r.effectiveDate >= :startDate AND r.effectiveDate <= :endDate")
    long countEffectiveInDateRange(@Param("startDate") OffsetDateTime startDate, @Param("endDate") OffsetDateTime endDate);
    
    @Query("SELECT r FROM Revision r WHERE r.partNumber = :partNumber AND r.revisionDate = (SELECT MAX(r2.revisionDate) FROM Revision r2 WHERE r2.partNumber = :partNumber)")
    Revision findLatestRevisionByPartNumber(@Param("partNumber") String partNumber);
    
    @Query("SELECT r FROM Revision r WHERE r.partNumber = :partNumber AND r.status = :status AND r.revisionDate = (SELECT MAX(r2.revisionDate) FROM Revision r2 WHERE r2.partNumber = :partNumber AND r2.status = :status)")
    Revision findLatestRevisionByPartNumberAndStatus(@Param("partNumber") String partNumber, @Param("status") RevisionStatus status);
}