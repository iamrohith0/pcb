package com.pcbxpress.erp.modules.sales.quotation.repository;

import com.pcbxpress.erp.modules.sales.quotation.model.Quotation;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, UUID> {
    Optional<Quotation> findTopByOrderByCreatedAtDesc();
    boolean existsByQuoteNoIgnoreCase(String quoteNo);
}
