package com.pcbxpress.erp.modules.procurement.pricing.repository;

import com.pcbxpress.erp.modules.procurement.pricing.model.SupplierPricing;
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
public interface SupplierPricingRepository extends JpaRepository<SupplierPricing, UUID> {

    List<SupplierPricing> findBySupplierId(UUID supplierId);
    
    List<SupplierPricing> findByItemId(UUID itemId);
    
    List<SupplierPricing> findBySupplierIdAndItemId(UUID supplierId, UUID itemId);
    
    List<SupplierPricing> findByStatus(String status);
    
    List<SupplierPricing> findByEffectiveDateLessThanEqualAndExpiryDateGreaterThanEqual(OffsetDateTime effectiveDate, OffsetDateTime expiryDate);
    
    @Query("SELECT sp FROM SupplierPricing sp WHERE sp.supplierId = :supplierId AND sp.itemId = :itemId AND sp.status = 'ACTIVE' AND sp.effectiveDate <= :date AND (sp.expiryDate IS NULL OR sp.expiryDate >= :date) ORDER BY sp.effectiveDate DESC")
    List<SupplierPricing> findActiveBySupplierAndItemAndDate(@Param("supplierId") UUID supplierId, 
                                                           @Param("itemId") UUID itemId, 
                                                           @Param("date") OffsetDateTime date);
    
    @Query("SELECT sp FROM SupplierPricing sp WHERE sp.itemId = :itemId AND sp.status = 'ACTIVE' AND sp.effectiveDate <= :date AND (sp.expiryDate IS NULL OR sp.expiryDate >= :date) ORDER BY sp.unitPrice ASC")
    List<SupplierPricing> findActiveByItemOrderByPrice(@Param("itemId") UUID itemId, 
                                                    @Param("date") OffsetDateTime date);
    
    @Query("SELECT sp FROM SupplierPricing sp WHERE " +
           "LOWER(sp.supplierName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(sp.itemCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(sp.itemDescription) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<SupplierPricing> findByQuery(@Param("query") String query);
    
    @Query("SELECT sp FROM SupplierPricing sp WHERE " +
           "(:status IS NULL OR LOWER(sp.status) = LOWER(:status)) AND " +
           "(LOWER(sp.supplierName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(sp.itemCode) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(sp.itemDescription) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<SupplierPricing> findByStatusAndQuery(@Param("status") String status, 
                                             @Param("query") String query, 
                                             Pageable pageable);
    
    @Query("SELECT sp FROM SupplierPricing sp WHERE sp.status IN :statuses")
    List<SupplierPricing> findByStatusIn(@Param("statuses") List<String> statuses);
    
    @Query("SELECT sp FROM SupplierPricing sp WHERE sp.effectiveDate >= :fromDate AND sp.effectiveDate <= :toDate")
    List<SupplierPricing> findByEffectiveDateRange(@Param("fromDate") OffsetDateTime fromDate, 
                                                 @Param("toDate") OffsetDateTime toDate);
    
    @Query("SELECT sp FROM SupplierPricing sp WHERE sp.currency = :currency")
    List<SupplierPricing> findByCurrency(@Param("currency") String currency);
    
    @Query("SELECT sp FROM SupplierPricing sp WHERE sp.unitPrice >= :minPrice AND sp.unitPrice <= :maxPrice")
    List<SupplierPricing> findByUnitPriceRange(@Param("minPrice") Double minPrice, 
                                             @Param("maxPrice") Double maxPrice);
    
    @Query("SELECT sp FROM SupplierPricing sp WHERE sp.supplierId = :supplierId AND sp.status = 'ACTIVE' AND sp.effectiveDate <= :date AND (sp.expiryDate IS NULL OR sp.expiryDate >= :date)")
    List<SupplierPricing> findActiveBySupplier(@Param("supplierId") UUID supplierId, 
                                             @Param("date") OffsetDateTime date);
    
    @Query("SELECT sp FROM SupplierPricing sp WHERE sp.itemId = :itemId AND sp.status = 'ACTIVE' AND sp.effectiveDate <= :date AND (sp.expiryDate IS NULL OR sp.expiryDate >= :date)")
    List<SupplierPricing> findActiveByItem(@Param("itemId") UUID itemId, 
                                        @Param("date") OffsetDateTime date);
}