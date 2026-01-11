package com.pcbxpress.erp.modules.quality.capa.repository;

import com.pcbxpress.erp.modules.quality.capa.model.CAPA;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CAPARepository extends JpaRepository<CAPA, Long> {
    
    Optional<CAPA> findByCapaNo(String capaNo);
    
    boolean existsByCapaNo(String capaNo);
    
    @Query("SELECT c FROM CAPA c WHERE " +
           "(:search IS NULL OR LOWER(c.title) LIKE %:search% OR LOWER(c.problemStatement) LIKE %:search% " +
           "OR LOWER(c.partNo) LIKE %:search% OR LOWER(c.jobNo) LIKE %:search% OR LOWER(c.lotNo) LIKE %:search%) " +
           "AND (:status IS NULL OR c.status = :status) " +
           "AND (:severity IS NULL OR c.severity = :severity) " +
           "AND (:sourceType IS NULL OR c.sourceType = :sourceType) " +
           "AND (:owner IS NULL OR LOWER(c.ownerName) LIKE %:owner%) " +
           "AND (:from IS NULL OR c.createdAt >= :from) " +
           "AND (:to IS NULL OR c.createdAt <= :to)")
    Page<CAPA> findByFilters(
        @Param("search") String search,
        @Param("status") CAPA.Status status,
        @Param("severity") CAPA.Severity severity,
        @Param("sourceType") CAPA.SourceType sourceType,
        @Param("owner") String owner,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        Pageable pageable
    );
    
    @Query("SELECT c FROM CAPA c WHERE c.status IN :statuses")
    List<CAPA> findByStatuses(List<CAPA.Status> statuses);
    
    @Query("SELECT c FROM CAPA c WHERE c.dueDate < :date AND c.status NOT IN :excludedStatuses")
    List<CAPA> findOverdueCAPAs(@Param("date") LocalDateTime date, @Param("excludedStatuses") List<CAPA.Status> excludedStatuses);
}