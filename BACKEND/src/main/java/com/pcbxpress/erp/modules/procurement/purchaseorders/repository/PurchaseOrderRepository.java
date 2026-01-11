package com.pcbxpress.erp.modules.procurement.purchaseorders.repository;

import com.pcbxpress.erp.modules.procurement.purchaseorders.model.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {

    Optional<PurchaseOrder> findByPoNumber(String poNumber);
    
    List<PurchaseOrder> findBySupplierId(UUID supplierId);
    
    List<PurchaseOrder> findByStatus(String status);
    
    List<PurchaseOrder> findByPoDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    List<PurchaseOrder> findByDeliveryDateBetween(OffsetDateTime startDate, OffsetDateTime endDate);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "LOWER(po.poNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(po.supplierName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(po.supplierCode) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<PurchaseOrder> findByQuery(@Param("query") String query);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "(:status IS NULL OR LOWER(po.status) = LOWER(:status)) AND " +
           "(LOWER(po.poNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(po.supplierName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(po.supplierCode) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<PurchaseOrder> findByStatusAndQuery(@Param("status") String status, 
                                           @Param("query") String query, 
                                           Pageable pageable);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE po.status IN :statuses")
    List<PurchaseOrder> findByStatusIn(@Param("statuses") List<String> statuses);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE po.poDate >= :fromDate AND po.poDate <= :toDate")
    List<PurchaseOrder> findByPoDateRange(@Param("fromDate") OffsetDateTime fromDate, 
                                        @Param("toDate") OffsetDateTime toDate);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE po.deliveryDate >= :fromDate AND po.deliveryDate <= :toDate")
    List<PurchaseOrder> findByDeliveryDateRange(@Param("fromDate") OffsetDateTime fromDate, 
                                              @Param("toDate") OffsetDateTime toDate);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE po.currency = :currency")
    List<PurchaseOrder> findByCurrency(@Param("currency") String currency);
    
    @Query("SELECT po FROM PurchaseOrder po WHERE po.grandTotal >= :minAmount AND po.grandTotal <= :maxAmount")
    List<PurchaseOrder> findByGrandTotalRange(@Param("minAmount") Double minAmount, 
                                            @Param("maxAmount") Double maxAmount);
}