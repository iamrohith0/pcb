package com.pcbxpress.erp.modules.sales.customer.repository;

import com.pcbxpress.erp.modules.sales.customer.model.CustomerNote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerNoteRepository extends JpaRepository<CustomerNote, Long> {

    List<CustomerNote> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    Page<CustomerNote> findByCustomerIdOrderByCreatedAtDesc(UUID customerId, Pageable pageable);

    List<CustomerNote> findByCustomerIdAndNoteTypeOrderByCreatedAtDesc(UUID customerId, String noteType);

    Page<CustomerNote> findByCustomerIdAndNoteTypeOrderByCreatedAtDesc(UUID customerId, String noteType, Pageable pageable);

    @Query("SELECT cn FROM CustomerNote cn WHERE cn.customerId = :customerId AND cn.noteType = :noteType AND cn.title LIKE %:title% ORDER BY cn.createdAt DESC")
    List<CustomerNote> findByCustomerIdAndNoteTypeAndTitleContaining(@Param("customerId") UUID customerId, 
                                                                   @Param("noteType") String noteType, 
                                                                   @Param("title") String title);

    @Query("SELECT cn FROM CustomerNote cn WHERE cn.customerId = :customerId AND cn.title LIKE %:title% ORDER BY cn.createdAt DESC")
    List<CustomerNote> findByCustomerIdAndTitleContaining(@Param("customerId") UUID customerId, 
                                                         @Param("title") String title);

    long countByCustomerId(UUID customerId);

    long countByCustomerIdAndNoteType(UUID customerId, String noteType);
}