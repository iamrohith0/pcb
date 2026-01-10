package com.pcbxpress.erp.modules.admin.masters.repository;

import com.pcbxpress.erp.modules.admin.masters.model.MaterialMaster;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Admin Material Master
 */
@Repository
public interface MaterialMasterRepository extends JpaRepository<MaterialMaster, UUID> {
    
    /**
     * Find material by material code (case insensitive)
     */
    MaterialMaster findByMaterialCodeIgnoreCase(String materialCode);
    
    /**
     * Find materials by name containing text (case insensitive)
     */
    List<MaterialMaster> findByNameContainingIgnoreCase(String name);
    
    /**
     * Check if material code exists (excluding current material)
     */
    boolean existsByMaterialCodeIgnoreCaseAndIdNot(String materialCode, UUID id);
    
    /**
     * Find materials by material type
     */
    List<MaterialMaster> findByMaterialType(MaterialMaster.MaterialType materialType);
    
    /**
     * Find materials by status
     */
    List<MaterialMaster> findByStatus(MaterialMaster.Status status);
    
    /**
     * Find materials by unit of measure
     */
    List<MaterialMaster> findByUnitOfMeasure(String unitOfMeasure);
    
    /**
     * Find materials by preferred vendor
     */
    List<MaterialMaster> findByPreferredVendorIgnoreCase(String preferredVendor);
    
    /**
     * Find materials by vendor part number
     */
    List<MaterialMaster> findByVendorPartNoIgnoreCase(String vendorPartNo);
    
    /**
     * Find materials by material class
     */
    List<MaterialMaster> findByMaterialClassIgnoreCase(String materialClass);
    
    /**
     * Find materials by finish
     */
    List<MaterialMaster> findByFinishIgnoreCase(String finish);
    
    /**
     * Find materials by color
     */
    List<MaterialMaster> findByColorIgnoreCase(String color);
    
    /**
     * Find materials by thickness range
     */
    List<MaterialMaster> findByThicknessMmBetween(BigDecimal min, BigDecimal max);
    
    /**
     * Find materials by copper weight range
     */
    List<MaterialMaster> findByCopperOzBetween(BigDecimal min, BigDecimal max);
    
    /**
     * Find materials by Tg range
     */
    List<MaterialMaster> findByTgBetween(BigDecimal min, BigDecimal max);
    
    /**
     * Find materials by unit price range
     */
    List<MaterialMaster> findByUnitPriceBetween(BigDecimal min, BigDecimal max);
    
    /**
     * Find materials by lead time range
     */
    List<MaterialMaster> findByLeadTimeDaysBetween(Integer min, Integer max);
    
    /**
     * Find materials by RoHS compliance
     */
    List<MaterialMaster> findByIsRoHS(boolean isRoHS);
    
    /**
     * Find materials by REACH compliance
     */
    List<MaterialMaster> findByIsReach(boolean isReach);
    
    /**
     * Find materials by UL compliance
     */
    List<MaterialMaster> findByIsUl(boolean isUl);
    
    
    /**
     * Find materials by multiple criteria
     */
    @Query("SELECT mm FROM MaterialMaster mm WHERE " +
           "(:materialType IS NULL OR mm.materialType = :materialType) " +
           "AND (:status IS NULL OR mm.status = :status) " +
           "AND (:unitOfMeasure IS NULL OR LOWER(mm.unitOfMeasure) = LOWER(:unitOfMeasure)) " +
           "AND (:preferredVendor IS NULL OR LOWER(mm.preferredVendor) LIKE LOWER(CONCAT('%', :preferredVendor, '%'))) " +
           "AND (:materialClass IS NULL OR LOWER(mm.materialClass) LIKE LOWER(CONCAT('%', :materialClass, '%'))) " +
           "AND (:finish IS NULL OR LOWER(mm.finish) LIKE LOWER(CONCAT('%', :finish, '%'))) " +
           "AND (:color IS NULL OR LOWER(mm.color) LIKE LOWER(CONCAT('%', :color, '%'))) " +
           "AND (:minThickness IS NULL OR mm.thicknessMm >= :minThickness) " +
           "AND (:maxThickness IS NULL OR mm.thicknessMm <= :maxThickness) " +
           "AND (:minCopper IS NULL OR mm.copperOz >= :minCopper) " +
           "AND (:maxCopper IS NULL OR mm.copperOz <= :maxCopper) " +
           "AND (:minTg IS NULL OR mm.tg >= :minTg) " +
           "AND (:maxTg IS NULL OR mm.tg <= :maxTg) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(mm.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(mm.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(mm.materialCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(mm.vendorPartNo) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<MaterialMaster> findByCriteria(@Param("materialType") MaterialMaster.MaterialType materialType,
                                       @Param("status") MaterialMaster.Status status,
                                       @Param("unitOfMeasure") String unitOfMeasure,
                                       @Param("preferredVendor") String preferredVendor,
                                       @Param("materialClass") String materialClass,
                                       @Param("finish") String finish,
                                       @Param("color") String color,
                                       @Param("minThickness") BigDecimal minThickness,
                                       @Param("maxThickness") BigDecimal maxThickness,
                                       @Param("minCopper") BigDecimal minCopper,
                                       @Param("maxCopper") BigDecimal maxCopper,
                                       @Param("minTg") BigDecimal minTg,
                                       @Param("maxTg") BigDecimal maxTg,
                                       @Param("searchText") String searchText);
    
    /**
     * Count materials by material type
     */
    long countByMaterialType(MaterialMaster.MaterialType materialType);
    
    /**
     * Count materials by status
     */
    long countByStatus(MaterialMaster.Status status);
    
    /**
     * Count materials by preferred vendor
     */
    long countByPreferredVendorIgnoreCase(String preferredVendor);
    
    /**
     * Find materials needing reorder (current stock below reorder point)
     * Note: This would typically require a join with inventory, but for now we'll return materials with reorder point set
     */
    List<MaterialMaster> findByReorderPointIsNotNull();
    
    /**
     * Find materials with minimum stock level
     */
    List<MaterialMaster> findByMinStockIsNotNull();
    
    /**
     * Find materials by currency
     */
    List<MaterialMaster> findByCurrencyIgnoreCase(String currency);
}