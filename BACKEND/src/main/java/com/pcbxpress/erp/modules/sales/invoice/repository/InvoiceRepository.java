package com.pcbxpress.erp.modules.sales.invoice.repository;

import com.pcbxpress.erp.modules.sales.invoice.model.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    // Find by invoice number
    Invoice findByInvoiceNo(String invoiceNo);

    // Find by customer ID
    List<Invoice> findByCustomerId(UUID customerId);

    // Find by status
    List<Invoice> findByStatus(String status);

    // Find by source order ID
    List<Invoice> findBySourceOrderId(UUID sourceOrderId);

    // Find by source type
    List<Invoice> findBySourceType(String sourceType);

    // Find by date range
    List<Invoice> findByInvoiceDateBetween(LocalDate startDate, LocalDate endDate);

    // Find by invoice date after
    List<Invoice> findByInvoiceDateAfter(LocalDate date);

    // Find by invoice date before
    List<Invoice> findByInvoiceDateBefore(LocalDate date);

    // Custom query for searching invoices
    @Query("SELECT i FROM Invoice i WHERE " +
           "(:query IS NULL OR LOWER(i.invoiceNo) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(i.billingName) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(i.status) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "AND (:status IS NULL OR i.status = :status) " +
           "AND (:from IS NULL OR i.invoiceDate >= :from) " +
           "AND (:to IS NULL OR i.invoiceDate <= :to)")
    Page<Invoice> searchInvoices(@Param("query") String query,
                                @Param("status") String status,
                                @Param("from") LocalDate from,
                                @Param("to") LocalDate to,
                                Pageable pageable);

    // Count by status
    long countByStatus(String status);

    // Find by customer and status
    List<Invoice> findByCustomerIdAndStatus(UUID customerId, String status);

    // Find by customer and date range
    List<Invoice> findByCustomerIdAndInvoiceDateBetween(UUID customerId, LocalDate startDate, LocalDate endDate);
}