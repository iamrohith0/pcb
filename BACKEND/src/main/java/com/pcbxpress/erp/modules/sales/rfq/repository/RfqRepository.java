package com.pcbxpress.erp.modules.sales.rfq.repository;

import com.pcbxpress.erp.modules.sales.rfq.model.Rfq;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RfqRepository extends JpaRepository<Rfq, UUID> {
    Optional<Rfq> findTopByRfqNoStartingWithOrderByRfqNoDesc(String prefix);
    boolean existsByRfqNoIgnoreCase(String rfqNo);
}
