package com.pcbxpress.erp.modules.procurement.suppliers.repository;

import com.pcbxpress.erp.modules.procurement.suppliers.model.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, UUID> {

    Optional<Supplier> findBySupplierCode(String supplierCode);
    
    Optional<Supplier> findByEmail(String email);
    
    Optional<Supplier> findByGstin(String gstin);
    
    Optional<Supplier> findByPan(String pan);
    
    boolean existsBySupplierCodeIgnoreCaseAndIdNot(String supplierCode, UUID id);
    
    boolean existsByEmailIgnoreCaseAndIdNot(String email, UUID id);
    
    boolean existsByGstinIgnoreCaseAndIdNot(String gstin, UUID id);
    
    boolean existsByPanIgnoreCaseAndIdNot(String pan, UUID id);
    
    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
    
    boolean existsByCompanyNameIgnoreCaseAndIdNot(String companyName, UUID id);
    
    @Query("SELECT s FROM Supplier s WHERE " +
           "LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.supplierCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.gstin) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.pan) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Supplier> findByQuery(@Param("query") String query);
    
    @Query("SELECT s FROM Supplier s WHERE " +
           "(:status IS NULL OR LOWER(s.status) = LOWER(:status)) AND " +
           "(LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.companyName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.supplierCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.gstin) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.pan) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Supplier> findByStatusAndQuery(@Param("status") String status, 
                                       @Param("query") String query, 
                                       Pageable pageable);
    
    @Query("SELECT s FROM Supplier s WHERE s.status = :status")
    List<Supplier> findByStatus(@Param("status") String status);
    
    @Query("SELECT s FROM Supplier s WHERE s.status IN :statuses")
    List<Supplier> findByStatusIn(@Param("statuses") List<String> statuses);
    
    @Query("SELECT s FROM Supplier s WHERE s.leadTimeDays <= :maxDays")
    List<Supplier> findByLeadTimeDaysLessThanEqual(@Param("maxDays") Integer maxDays);
    
    @Query("SELECT s FROM Supplier s WHERE s.creditLimit >= :minLimit")
    List<Supplier> findByCreditLimitGreaterThanEqual(@Param("minLimit") Double minLimit);
}