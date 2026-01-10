package com.pcbxpress.erp.modules.sales.invoice.repository;

import com.pcbxpress.erp.modules.sales.invoice.model.Invoice;
import com.pcbxpress.erp.modules.sales.invoice.model.InvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InvoiceItemRepository extends JpaRepository<InvoiceItem, UUID> {

    // Find by invoice
    List<InvoiceItem> findByInvoice(Invoice invoice);

    // Find by invoice ID
    List<InvoiceItem> findByInvoiceId(UUID invoiceId);

    // Delete by invoice
    void deleteByInvoice(Invoice invoice);

    // Delete by invoice ID
    void deleteByInvoiceId(UUID invoiceId);
}