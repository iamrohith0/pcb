package com.pcbxpress.erp.modules.sales.customer.repository;

import com.pcbxpress.erp.modules.sales.customer.model.CustomerDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerDocumentRepository extends JpaRepository<CustomerDocument, Long> {

    List<CustomerDocument> findByCustomerId(UUID customerId);

    List<CustomerDocument> findByCustomerIdAndIsActiveTrue(UUID customerId);

    List<CustomerDocument> findByCustomerIdAndDocumentType(UUID customerId, String documentType);

    List<CustomerDocument> findByCustomerIdAndDocumentTypeAndIsActiveTrue(UUID customerId, String documentType);

    @Query("SELECT cd FROM CustomerDocument cd WHERE cd.customerId = :customerId AND cd.documentType = :documentType AND cd.isActive = true ORDER BY cd.uploadedAt DESC")
    List<CustomerDocument> findLatestByCustomerIdAndDocumentType(@Param("customerId") UUID customerId, 
                                                                @Param("documentType") String documentType);

    @Query("SELECT cd FROM CustomerDocument cd WHERE cd.customerId = :customerId AND cd.expiresAt < :expirationDate AND cd.isActive = true")
    List<CustomerDocument> findExpiringDocuments(@Param("customerId") UUID customerId, 
                                                @Param("expirationDate") OffsetDateTime expirationDate);

    @Query("SELECT cd FROM CustomerDocument cd WHERE cd.expiresAt < :expirationDate AND cd.isActive = true")
    List<CustomerDocument> findExpiringDocuments(@Param("expirationDate") OffsetDateTime expirationDate);

    long countByCustomerIdAndIsActiveTrue(UUID customerId);

    boolean existsByCustomerIdAndDocumentTypeAndIsActiveTrue(UUID customerId, String documentType);
}