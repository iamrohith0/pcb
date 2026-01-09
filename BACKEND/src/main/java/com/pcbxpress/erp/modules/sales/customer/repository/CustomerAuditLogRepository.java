package com.pcbxpress.erp.modules.sales.customer.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.pcbxpress.erp.modules.sales.customer.model.CustomerAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerAuditLogRepository extends JpaRepository<CustomerAuditLog, Long> {

    List<CustomerAuditLog> findByCustomerIdOrderByCreatedAtDesc(UUID customerId);

    Page<CustomerAuditLog> findByCustomerIdOrderByCreatedAtDesc(UUID customerId, Pageable pageable);

    List<CustomerAuditLog> findByCustomerIdAndActionOrderByCreatedAtDesc(UUID customerId, String action);

    Page<CustomerAuditLog> findByCustomerIdAndActionOrderByCreatedAtDesc(UUID customerId, String action, Pageable pageable);

    @Query("SELECT cal FROM CustomerAuditLog cal WHERE cal.customerId = :customerId AND cal.changedBy = :changedBy ORDER BY cal.createdAt DESC")
    List<CustomerAuditLog> findByCustomerIdAndChangedByOrderByCreatedAtDesc(@Param("customerId") UUID customerId, 
                                                                           @Param("changedBy") String changedBy);

    @Query("SELECT cal FROM CustomerAuditLog cal WHERE cal.customerId = :customerId AND cal.createdAt >= :startDate AND cal.createdAt <= :endDate ORDER BY cal.createdAt DESC")
    List<CustomerAuditLog> findByCustomerIdAndCreatedAtBetweenOrderByCreatedAtDesc(@Param("customerId") UUID customerId, 
                                                                                 @Param("startDate") OffsetDateTime startDate, 
                                                                                 @Param("endDate") OffsetDateTime endDate);

    @Query("SELECT cal FROM CustomerAuditLog cal WHERE cal.customerId = :customerId AND cal.action = :action AND cal.createdAt >= :startDate AND cal.createdAt <= :endDate ORDER BY cal.createdAt DESC")
    List<CustomerAuditLog> findByCustomerIdAndActionAndCreatedAtBetweenOrderByCreatedAtDesc(@Param("customerId") UUID customerId, 
                                                                                          @Param("action") String action, 
                                                                                          @Param("startDate") OffsetDateTime startDate, 
                                                                                          @Param("endDate") OffsetDateTime endDate);


    @Query("SELECT cal FROM CustomerAuditLog cal WHERE cal.customerId = :customerId AND cal.newValues = :fieldValue ORDER BY cal.createdAt DESC")
    List<CustomerAuditLog> findByCustomerIdAndNewValuesFieldEqualsOrderByCreatedAtDesc(@Param("customerId") UUID customerId,
                                                                                    @Param("fieldValue") JsonNode fieldValue);

    long countByCustomerId(UUID customerId);

    long countByCustomerIdAndAction(UUID customerId, String action);
}