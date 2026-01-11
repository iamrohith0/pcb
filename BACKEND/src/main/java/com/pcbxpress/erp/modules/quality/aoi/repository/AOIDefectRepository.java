package com.pcbxpress.erp.modules.quality.aoi.repository;

import com.pcbxpress.erp.modules.quality.aoi.model.AOIDefect;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AOIDefectRepository extends JpaRepository<AOIDefect, Long> {
    
    Optional<AOIDefect> findByCode(String code);
    
    boolean existsByCode(String code);
    
    @Query("SELECT d FROM AOIDefect d WHERE " +
           "(:search IS NULL OR LOWER(d.code) LIKE %:search% OR LOWER(d.name) LIKE %:search% OR LOWER(d.category) LIKE %:search%) " +
           "AND (:status IS NULL OR d.isActive = :status)")
    Page<AOIDefect> findBySearchAndStatus(
        @Param("search") String search,
        @Param("status") Boolean status,
        Pageable pageable
    );
    
    @Query("SELECT d FROM AOIDefect d WHERE " +
           "(:search IS NULL OR LOWER(d.code) LIKE %:search% OR LOWER(d.name) LIKE %:search% OR LOWER(d.category) LIKE %:search%) " +
           "AND (:status IS NULL OR d.isActive = :status)")
    List<AOIDefect> findBySearchAndStatus(
        @Param("search") String search,
        @Param("status") Boolean status
    );
    
    @Query("SELECT d FROM AOIDefect d WHERE d.isActive = true")
    List<AOIDefect> findAllActive();
}