package com.pcbxpress.erp.modules.sales.salesorder.repository;

import com.pcbxpress.erp.modules.sales.salesorder.model.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SalesOrderRepository extends JpaRepository<SalesOrder, UUID> {
    Optional<SalesOrder> findByOrderNo(String orderNo);
}
