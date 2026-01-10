package com.pcbxpress.erp.modules.maintenance.equipment.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.pcbxpress.erp.modules.maintenance.equipment.model.Equipment;

/**
 * Repository interface for Equipment entity
 */
@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, UUID> {
    
    /**
     * Find equipment by equipment code
     */
    Equipment findByEquipmentCode(String equipmentCode);
    
    /**
     * Find equipment by serial number
     */
    Equipment findBySerialNumber(String serialNumber);
    
    /**
     * Find equipment by asset tag
     */
    Equipment findByAssetTag(String assetTag);
    
    /**
     * Find equipment by barcode
     */
    Equipment findByBarcode(String barcode);
    
    /**
     * Find equipment by manufacturer
     */
    List<Equipment> findByManufacturer(String manufacturer);
    
    /**
     * Find equipment by model
     */
    List<Equipment> findByModel(String model);
    
    /**
     * Find equipment by location
     */
    List<Equipment> findByLocation(String location);
    
    /**
     * Find equipment by status
     */
    List<Equipment> findByStatus(String status);
    
    /**
     * Find equipment by equipment type
     */
    List<Equipment> findByEquipmentType(String equipmentType);
    
    /**
     * Find equipment by responsible person
     */
    List<Equipment> findByResponsiblePerson(String responsiblePerson);
    
    /**
     * Find equipment by department
     */
    List<Equipment> findByDepartment(String department);
    
    /**
     * Find equipment by cost center
     */
    List<Equipment> findByCostCenter(String costCenter);
    
    /**
     * Find equipment by criticality
     */
    List<Equipment> findByCriticality(String criticality);
    
    /**
     * Find equipment by category
     */
    List<Equipment> findByCategory(String category);
    
    /**
     * Find equipment by sub category
     */
    List<Equipment> findBySubCategory(String subCategory);
    
    /**
     * Find equipment by supplier
     */
    List<Equipment> findBySupplier(String supplier);
    
    /**
     * Find equipment by installation date range
     */
    @Query("SELECT e FROM Equipment e WHERE e.installationDate BETWEEN :startDate AND :endDate")
    List<Equipment> findByInstallationDateBetween(@Param("startDate") LocalDateTime startDate, 
                                                 @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find equipment by last maintenance date range
     */
    @Query("SELECT e FROM Equipment e WHERE e.lastMaintenanceDate BETWEEN :startDate AND :endDate")
    List<Equipment> findByLastMaintenanceDateBetween(@Param("startDate") LocalDateTime startDate, 
                                                    @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find equipment by next maintenance date range
     */
    @Query("SELECT e FROM Equipment e WHERE e.nextMaintenanceDate BETWEEN :startDate AND :endDate")
    List<Equipment> findByNextMaintenanceDateBetween(@Param("startDate") LocalDateTime startDate, 
                                                    @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find equipment by purchase date range
     */
    @Query("SELECT e FROM Equipment e WHERE e.purchaseDate BETWEEN :startDate AND :endDate")
    List<Equipment> findByPurchaseDateBetween(@Param("startDate") LocalDateTime startDate, 
                                             @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find equipment by warranty expiry date range
     */
    @Query("SELECT e FROM Equipment e WHERE e.warrantyExpiryDate BETWEEN :startDate AND :endDate")
    List<Equipment> findByWarrantyExpiryDateBetween(@Param("startDate") LocalDateTime startDate, 
                                                   @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find equipment by total operating hours range
     */
    @Query("SELECT e FROM Equipment e WHERE e.totalOperatingHours BETWEEN :minHours AND :maxHours")
    List<Equipment> findByTotalOperatingHoursBetween(@Param("minHours") Long minHours, 
                                                    @Param("maxHours") Long maxHours);
    
    /**
     * Find equipment by last operating hours range
     */
    @Query("SELECT e FROM Equipment e WHERE e.lastOperatingHours BETWEEN :minHours AND :maxHours")
    List<Equipment> findByLastOperatingHoursBetween(@Param("minHours") Long minHours, 
                                                   @Param("maxHours") Long maxHours);
    
    /**
     * Find equipment by purchase price range
     */
    @Query("SELECT e FROM Equipment e WHERE e.purchasePrice BETWEEN :minPrice AND :maxPrice")
    List<Equipment> findByPurchasePriceBetween(@Param("minPrice") Double minPrice, 
                                              @Param("maxPrice") Double maxPrice);
    
    /**
     * Find equipment by manufacturer and model
     */
    List<Equipment> findByManufacturerAndModel(String manufacturer, String model);
    
    /**
     * Find equipment by manufacturer and equipment type
     */
    List<Equipment> findByManufacturerAndEquipmentType(String manufacturer, String equipmentType);
    
    /**
     * Find equipment by manufacturer and location
     */
    List<Equipment> findByManufacturerAndLocation(String manufacturer, String location);
    
    /**
     * Find equipment by manufacturer and status
     */
    List<Equipment> findByManufacturerAndStatus(String manufacturer, String status);
    
    /**
     * Find equipment by manufacturer and criticality
     */
    List<Equipment> findByManufacturerAndCriticality(String manufacturer, String criticality);
    
    /**
     * Find equipment by manufacturer and category
     */
    List<Equipment> findByManufacturerAndCategory(String manufacturer, String category);
    
    /**
     * Find equipment by manufacturer and department
     */
    List<Equipment> findByManufacturerAndDepartment(String manufacturer, String department);
    
    /**
     * Find equipment by manufacturer and cost center
     */
    List<Equipment> findByManufacturerAndCostCenter(String manufacturer, String costCenter);
    
    /**
     * Find equipment by model and equipment type
     */
    List<Equipment> findByModelAndEquipmentType(String model, String equipmentType);
    
    /**
     * Find equipment by model and location
     */
    List<Equipment> findByModelAndLocation(String model, String location);
    
    /**
     * Find equipment by model and status
     */
    List<Equipment> findByModelAndStatus(String model, String status);
    
    /**
     * Find equipment by model and criticality
     */
    List<Equipment> findByModelAndCriticality(String model, String criticality);
    
    /**
     * Find equipment by model and category
     */
    List<Equipment> findByModelAndCategory(String model, String category);
    
    /**
     * Find equipment by model and department
     */
    List<Equipment> findByModelAndDepartment(String model, String department);
    
    /**
     * Find equipment by model and cost center
     */
    List<Equipment> findByModelAndCostCenter(String model, String costCenter);
    
    /**
     * Find equipment by location and status
     */
    List<Equipment> findByLocationAndStatus(String location, String status);
    
    /**
     * Find equipment by location and equipment type
     */
    List<Equipment> findByLocationAndEquipmentType(String location, String equipmentType);
    
    /**
     * Find equipment by location and criticality
     */
    List<Equipment> findByLocationAndCriticality(String location, String criticality);
    
    /**
     * Find equipment by location and category
     */
    List<Equipment> findByLocationAndCategory(String location, String category);
    
    /**
     * Find equipment by location and department
     */
    List<Equipment> findByLocationAndDepartment(String location, String department);
    
    /**
     * Find equipment by location and cost center
     */
    List<Equipment> findByLocationAndCostCenter(String location, String costCenter);
    
    /**
     * Find equipment by status and equipment type
     */
    List<Equipment> findByStatusAndEquipmentType(String status, String equipmentType);
    
    /**
     * Find equipment by status and criticality
     */
    List<Equipment> findByStatusAndCriticality(String status, String criticality);
    
    /**
     * Find equipment by status and category
     */
    List<Equipment> findByStatusAndCategory(String status, String category);
    
    /**
     * Find equipment by status and department
     */
    List<Equipment> findByStatusAndDepartment(String status, String department);
    
    /**
     * Find equipment by status and cost center
     */
    List<Equipment> findByStatusAndCostCenter(String status, String costCenter);
    
    /**
     * Find equipment by equipment type and criticality
     */
    List<Equipment> findByEquipmentTypeAndCriticality(String equipmentType, String criticality);
    
    /**
     * Find equipment by equipment type and category
     */
    List<Equipment> findByEquipmentTypeAndCategory(String equipmentType, String category);
    
    /**
     * Find equipment by equipment type and department
     */
    List<Equipment> findByEquipmentTypeAndDepartment(String equipmentType, String department);
    
    /**
     * Find equipment by equipment type and cost center
     */
    List<Equipment> findByEquipmentTypeAndCostCenter(String equipmentType, String costCenter);
    
    /**
     * Find equipment by criticality and category
     */
    List<Equipment> findByCriticalityAndCategory(String criticality, String category);
    
    /**
     * Find equipment by criticality and department
     */
    List<Equipment> findByCriticalityAndDepartment(String criticality, String department);
    
    /**
     * Find equipment by criticality and cost center
     */
    List<Equipment> findByCriticalityAndCostCenter(String criticality, String costCenter);
    
    /**
     * Find equipment by category and department
     */
    List<Equipment> findByCategoryAndDepartment(String category, String department);
    
    /**
     * Find equipment by category and cost center
     */
    List<Equipment> findByCategoryAndCostCenter(String category, String costCenter);
    
    /**
     * Find equipment by department and cost center
     */
    List<Equipment> findByDepartmentAndCostCenter(String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, and equipment type
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentType(String manufacturer, String model, String equipmentType);
    
    /**
     * Find equipment by manufacturer, model, and location
     */
    List<Equipment> findByManufacturerAndModelAndLocation(String manufacturer, String model, String location);
    
    /**
     * Find equipment by manufacturer, model, and status
     */
    List<Equipment> findByManufacturerAndModelAndStatus(String manufacturer, String model, String status);
    
    /**
     * Find equipment by manufacturer, model, and criticality
     */
    List<Equipment> findByManufacturerAndModelAndCriticality(String manufacturer, String model, String criticality);
    
    /**
     * Find equipment by manufacturer, model, and category
     */
    List<Equipment> findByManufacturerAndModelAndCategory(String manufacturer, String model, String category);
    
    /**
     * Find equipment by manufacturer, model, and department
     */
    List<Equipment> findByManufacturerAndModelAndDepartment(String manufacturer, String model, String department);
    
    /**
     * Find equipment by manufacturer, model, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndCostCenter(String manufacturer, String model, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, and status
     */
    List<Equipment> findByManufacturerAndLocationAndStatus(String manufacturer, String location, String status);
    
    /**
     * Find equipment by manufacturer, location, and equipment type
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentType(String manufacturer, String location, String equipmentType);
    
    /**
     * Find equipment by manufacturer, location, and criticality
     */
    List<Equipment> findByManufacturerAndLocationAndCriticality(String manufacturer, String location, String criticality);
    
    /**
     * Find equipment by manufacturer, location, and category
     */
    List<Equipment> findByManufacturerAndLocationAndCategory(String manufacturer, String location, String category);
    
    /**
     * Find equipment by manufacturer, location, and department
     */
    List<Equipment> findByManufacturerAndLocationAndDepartment(String manufacturer, String location, String department);
    
    /**
     * Find equipment by manufacturer, location, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndCostCenter(String manufacturer, String location, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, and equipment type
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentType(String manufacturer, String status, String equipmentType);
    
    /**
     * Find equipment by manufacturer, status, and criticality
     */
    List<Equipment> findByManufacturerAndStatusAndCriticality(String manufacturer, String status, String criticality);
    
    /**
     * Find equipment by manufacturer, status, and category
     */
    List<Equipment> findByManufacturerAndStatusAndCategory(String manufacturer, String status, String category);
    
    /**
     * Find equipment by manufacturer, status, and department
     */
    List<Equipment> findByManufacturerAndStatusAndDepartment(String manufacturer, String status, String department);
    
    /**
     * Find equipment by manufacturer, status, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndCostCenter(String manufacturer, String status, String costCenter);
    
    /**
     * Find equipment by manufacturer, equipment type, and criticality
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCriticality(String manufacturer, String equipmentType, String criticality);
    
    /**
     * Find equipment by manufacturer, equipment type, and category
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCategory(String manufacturer, String equipmentType, String category);
    
    /**
     * Find equipment by manufacturer, equipment type, and department
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndDepartment(String manufacturer, String equipmentType, String department);
    
    /**
     * Find equipment by manufacturer, equipment type, and cost center
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCostCenter(String manufacturer, String equipmentType, String costCenter);
    
    /**
     * Find equipment by manufacturer, criticality, and category
     */
    List<Equipment> findByManufacturerAndCriticalityAndCategory(String manufacturer, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, criticality, and department
     */
    List<Equipment> findByManufacturerAndCriticalityAndDepartment(String manufacturer, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndCriticalityAndCostCenter(String manufacturer, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, category, and department
     */
    List<Equipment> findByManufacturerAndCategoryAndDepartment(String manufacturer, String category, String department);
    
    /**
     * Find equipment by manufacturer, category, and cost center
     */
    List<Equipment> findByManufacturerAndCategoryAndCostCenter(String manufacturer, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, department, and cost center
     */
    List<Equipment> findByManufacturerAndDepartmentAndCostCenter(String manufacturer, String department, String costCenter);
    
    /**
     * Find equipment by model, location, and status
     */
    List<Equipment> findByModelAndLocationAndStatus(String model, String location, String status);
    
    /**
     * Find equipment by model, location, and equipment type
     */
    List<Equipment> findByModelAndLocationAndEquipmentType(String model, String location, String equipmentType);
    
    /**
     * Find equipment by model, location, and criticality
     */
    List<Equipment> findByModelAndLocationAndCriticality(String model, String location, String criticality);
    
    /**
     * Find equipment by model, location, and category
     */
    List<Equipment> findByModelAndLocationAndCategory(String model, String location, String category);
    
    /**
     * Find equipment by model, location, and department
     */
    List<Equipment> findByModelAndLocationAndDepartment(String model, String location, String department);
    
    /**
     * Find equipment by model, location, and cost center
     */
    List<Equipment> findByModelAndLocationAndCostCenter(String model, String location, String costCenter);
    
    /**
     * Find equipment by model, status, and equipment type
     */
    List<Equipment> findByModelAndStatusAndEquipmentType(String model, String status, String equipmentType);
    
    /**
     * Find equipment by model, status, and criticality
     */
    List<Equipment> findByModelAndStatusAndCriticality(String model, String status, String criticality);
    
    /**
     * Find equipment by model, status, and category
     */
    List<Equipment> findByModelAndStatusAndCategory(String model, String status, String category);
    
    /**
     * Find equipment by model, status, and department
     */
    List<Equipment> findByModelAndStatusAndDepartment(String model, String status, String department);
    
    /**
     * Find equipment by model, status, and cost center
     */
    List<Equipment> findByModelAndStatusAndCostCenter(String model, String status, String costCenter);
    
    /**
     * Find equipment by model, equipment type, and criticality
     */
    List<Equipment> findByModelAndEquipmentTypeAndCriticality(String model, String equipmentType, String criticality);
    
    /**
     * Find equipment by model, equipment type, and category
     */
    List<Equipment> findByModelAndEquipmentTypeAndCategory(String model, String equipmentType, String category);
    
    /**
     * Find equipment by model, equipment type, and department
     */
    List<Equipment> findByModelAndEquipmentTypeAndDepartment(String model, String equipmentType, String department);
    
    /**
     * Find equipment by model, equipment type, and cost center
     */
    List<Equipment> findByModelAndEquipmentTypeAndCostCenter(String model, String equipmentType, String costCenter);
    
    /**
     * Find equipment by model, criticality, and category
     */
    List<Equipment> findByModelAndCriticalityAndCategory(String model, String criticality, String category);
    
    /**
     * Find equipment by model, criticality, and department
     */
    List<Equipment> findByModelAndCriticalityAndDepartment(String model, String criticality, String department);
    
    /**
     * Find equipment by model, criticality, and cost center
     */
    List<Equipment> findByModelAndCriticalityAndCostCenter(String model, String criticality, String costCenter);
    
    /**
     * Find equipment by model, category, and department
     */
    List<Equipment> findByModelAndCategoryAndDepartment(String model, String category, String department);
    
    /**
     * Find equipment by model, category, and cost center
     */
    List<Equipment> findByModelAndCategoryAndCostCenter(String model, String category, String costCenter);
    
    /**
     * Find equipment by model, department, and cost center
     */
    List<Equipment> findByModelAndDepartmentAndCostCenter(String model, String department, String costCenter);
    
    /**
     * Find equipment by location, status, and equipment type
     */
    List<Equipment> findByLocationAndStatusAndEquipmentType(String location, String status, String equipmentType);
    
    /**
     * Find equipment by location, status, and criticality
     */
    List<Equipment> findByLocationAndStatusAndCriticality(String location, String status, String criticality);
    
    /**
     * Find equipment by location, status, and category
     */
    List<Equipment> findByLocationAndStatusAndCategory(String location, String status, String category);
    
    /**
     * Find equipment by location, status, and department
     */
    List<Equipment> findByLocationAndStatusAndDepartment(String location, String status, String department);
    
    /**
     * Find equipment by location, status, and cost center
     */
    List<Equipment> findByLocationAndStatusAndCostCenter(String location, String status, String costCenter);
    
    /**
     * Find equipment by location, equipment type, and criticality
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCriticality(String location, String equipmentType, String criticality);
    
    /**
     * Find equipment by location, equipment type, and category
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCategory(String location, String equipmentType, String category);
    
    /**
     * Find equipment by location, equipment type, and department
     */
    List<Equipment> findByLocationAndEquipmentTypeAndDepartment(String location, String equipmentType, String department);
    
    /**
     * Find equipment by location, equipment type, and cost center
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCostCenter(String location, String equipmentType, String costCenter);
    
    /**
     * Find equipment by location, criticality, and category
     */
    List<Equipment> findByLocationAndCriticalityAndCategory(String location, String criticality, String category);
    
    /**
     * Find equipment by location, criticality, and department
     */
    List<Equipment> findByLocationAndCriticalityAndDepartment(String location, String criticality, String department);
    
    /**
     * Find equipment by location, criticality, and cost center
     */
    List<Equipment> findByLocationAndCriticalityAndCostCenter(String location, String criticality, String costCenter);
    
    /**
     * Find equipment by location, category, and department
     */
    List<Equipment> findByLocationAndCategoryAndDepartment(String location, String category, String department);
    
    /**
     * Find equipment by location, category, and cost center
     */
    List<Equipment> findByLocationAndCategoryAndCostCenter(String location, String category, String costCenter);
    
    /**
     * Find equipment by location, department, and cost center
     */
    List<Equipment> findByLocationAndDepartmentAndCostCenter(String location, String department, String costCenter);
    
    /**
     * Find equipment by status, equipment type, and criticality
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCriticality(String status, String equipmentType, String criticality);
    
    /**
     * Find equipment by status, equipment type, and category
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCategory(String status, String equipmentType, String category);
    
    /**
     * Find equipment by status, equipment type, and department
     */
    List<Equipment> findByStatusAndEquipmentTypeAndDepartment(String status, String equipmentType, String department);
    
    /**
     * Find equipment by status, equipment type, and cost center
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCostCenter(String status, String equipmentType, String costCenter);
    
    /**
     * Find equipment by status, criticality, and category
     */
    List<Equipment> findByStatusAndCriticalityAndCategory(String status, String criticality, String category);
    
    /**
     * Find equipment by status, criticality, and department
     */
    List<Equipment> findByStatusAndCriticalityAndDepartment(String status, String criticality, String department);
    
    /**
     * Find equipment by status, criticality, and cost center
     */
    List<Equipment> findByStatusAndCriticalityAndCostCenter(String status, String criticality, String costCenter);
    
    /**
     * Find equipment by status, category, and department
     */
    List<Equipment> findByStatusAndCategoryAndDepartment(String status, String category, String department);
    
    /**
     * Find equipment by status, category, and cost center
     */
    List<Equipment> findByStatusAndCategoryAndCostCenter(String status, String category, String costCenter);
    
    /**
     * Find equipment by status, department, and cost center
     */
    List<Equipment> findByStatusAndDepartmentAndCostCenter(String status, String department, String costCenter);
    
    /**
     * Find equipment by equipment type, criticality, and category
     */
    List<Equipment> findByEquipmentTypeAndCriticalityAndCategory(String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by equipment type, criticality, and department
     */
    List<Equipment> findByEquipmentTypeAndCriticalityAndDepartment(String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by equipment type, criticality, and cost center
     */
    List<Equipment> findByEquipmentTypeAndCriticalityAndCostCenter(String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by equipment type, category, and department
     */
    List<Equipment> findByEquipmentTypeAndCategoryAndDepartment(String equipmentType, String category, String department);
    
    /**
     * Find equipment by equipment type, category, and cost center
     */
    List<Equipment> findByEquipmentTypeAndCategoryAndCostCenter(String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by equipment type, department, and cost center
     */
    List<Equipment> findByEquipmentTypeAndDepartmentAndCostCenter(String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by criticality, category, and department
     */
    List<Equipment> findByCriticalityAndCategoryAndDepartment(String criticality, String category, String department);
    
    /**
     * Find equipment by criticality, category, and cost center
     */
    List<Equipment> findByCriticalityAndCategoryAndCostCenter(String criticality, String category, String costCenter);
    
    /**
     * Find equipment by criticality, department, and cost center
     */
    List<Equipment> findByCriticalityAndDepartmentAndCostCenter(String criticality, String department, String costCenter);
    
    /**
     * Find equipment by category, department, and cost center
     */
    List<Equipment> findByCategoryAndDepartmentAndCostCenter(String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, and status
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatus(String manufacturer, String model, String location, String status);
    
    /**
     * Find equipment by manufacturer, model, location, and equipment type
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentType(String manufacturer, String model, String location, String equipmentType);
    
    /**
     * Find equipment by manufacturer, model, location, and criticality
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCriticality(String manufacturer, String model, String location, String criticality);
    
    /**
     * Find equipment by manufacturer, model, location, and category
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCategory(String manufacturer, String model, String location, String category);
    
    /**
     * Find equipment by manufacturer, model, location, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndDepartment(String manufacturer, String model, String location, String department);
    
    /**
     * Find equipment by manufacturer, model, location, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCostCenter(String manufacturer, String model, String location, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, and equipment type
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentType(String manufacturer, String model, String status, String equipmentType);
    
    /**
     * Find equipment by manufacturer, model, status, and criticality
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCriticality(String manufacturer, String model, String status, String criticality);
    
    /**
     * Find equipment by manufacturer, model, status, and category
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCategory(String manufacturer, String model, String status, String category);
    
    /**
     * Find equipment by manufacturer, model, status, and department
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndDepartment(String manufacturer, String model, String status, String department);
    
    /**
     * Find equipment by manufacturer, model, status, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCostCenter(String manufacturer, String model, String status, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, equipment type, and criticality
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCriticality(String manufacturer, String model, String equipmentType, String criticality);
    
    /**
     * Find equipment by manufacturer, model, equipment type, and category
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCategory(String manufacturer, String model, String equipmentType, String category);
    
    /**
     * Find equipment by manufacturer, model, equipment type, and department
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndDepartment(String manufacturer, String model, String equipmentType, String department);
    
    /**
     * Find equipment by manufacturer, model, equipment type, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCostCenter(String manufacturer, String model, String equipmentType, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, criticality, and category
     */
    List<Equipment> findByManufacturerAndModelAndCriticalityAndCategory(String manufacturer, String model, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, model, criticality, and department
     */
    List<Equipment> findByManufacturerAndModelAndCriticalityAndDepartment(String manufacturer, String model, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, model, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndCriticalityAndCostCenter(String manufacturer, String model, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndCategoryAndDepartment(String manufacturer, String model, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndCategoryAndCostCenter(String manufacturer, String model, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndDepartmentAndCostCenter(String manufacturer, String model, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, and equipment type
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentType(String manufacturer, String location, String status, String equipmentType);
    
    /**
     * Find equipment by manufacturer, location, status, and criticality
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCriticality(String manufacturer, String location, String status, String criticality);
    
    /**
     * Find equipment by manufacturer, location, status, and category
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCategory(String manufacturer, String location, String status, String category);
    
    /**
     * Find equipment by manufacturer, location, status, and department
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndDepartment(String manufacturer, String location, String status, String department);
    
    /**
     * Find equipment by manufacturer, location, status, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCostCenter(String manufacturer, String location, String status, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, equipment type, and criticality
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCriticality(String manufacturer, String location, String equipmentType, String criticality);
    
    /**
     * Find equipment by manufacturer, location, equipment type, and category
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCategory(String manufacturer, String location, String equipmentType, String category);
    
    /**
     * Find equipment by manufacturer, location, equipment type, and department
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndDepartment(String manufacturer, String location, String equipmentType, String department);
    
    /**
     * Find equipment by manufacturer, location, equipment type, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCostCenter(String manufacturer, String location, String equipmentType, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, criticality, and category
     */
    List<Equipment> findByManufacturerAndLocationAndCriticalityAndCategory(String manufacturer, String location, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, location, criticality, and department
     */
    List<Equipment> findByManufacturerAndLocationAndCriticalityAndDepartment(String manufacturer, String location, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, location, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndCriticalityAndCostCenter(String manufacturer, String location, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, category, and department
     */
    List<Equipment> findByManufacturerAndLocationAndCategoryAndDepartment(String manufacturer, String location, String category, String department);
    
    /**
     * Find equipment by manufacturer, location, category, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndCategoryAndCostCenter(String manufacturer, String location, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndDepartmentAndCostCenter(String manufacturer, String location, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, equipment type, and criticality
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCriticality(String manufacturer, String status, String equipmentType, String criticality);
    
    /**
     * Find equipment by manufacturer, status, equipment type, and category
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCategory(String manufacturer, String status, String equipmentType, String category);
    
    /**
     * Find equipment by manufacturer, status, equipment type, and department
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndDepartment(String manufacturer, String status, String equipmentType, String department);
    
    /**
     * Find equipment by manufacturer, status, equipment type, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCostCenter(String manufacturer, String status, String equipmentType, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, criticality, and category
     */
    List<Equipment> findByManufacturerAndStatusAndCriticalityAndCategory(String manufacturer, String status, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, status, criticality, and department
     */
    List<Equipment> findByManufacturerAndStatusAndCriticalityAndDepartment(String manufacturer, String status, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, status, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndCriticalityAndCostCenter(String manufacturer, String status, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, category, and department
     */
    List<Equipment> findByManufacturerAndStatusAndCategoryAndDepartment(String manufacturer, String status, String category, String department);
    
    /**
     * Find equipment by manufacturer, status, category, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndCategoryAndCostCenter(String manufacturer, String status, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, department, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndDepartmentAndCostCenter(String manufacturer, String status, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, equipment type, criticality, and category
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCriticalityAndCategory(String manufacturer, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, equipment type, criticality, and department
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCriticalityAndDepartment(String manufacturer, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, equipment type, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCriticalityAndCostCenter(String manufacturer, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, equipment type, category, and department
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCategoryAndDepartment(String manufacturer, String equipmentType, String category, String department);
    
    /**
     * Find equipment by manufacturer, equipment type, category, and cost center
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCategoryAndCostCenter(String manufacturer, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, equipment type, department, and cost center
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndDepartmentAndCostCenter(String manufacturer, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndCriticalityAndCategoryAndDepartment(String manufacturer, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndCriticalityAndCategoryAndCostCenter(String manufacturer, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndCategoryAndDepartmentAndCostCenter(String manufacturer, String category, String department, String costCenter);
    
    /**
     * Find equipment by model, location, status, and equipment type
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentType(String model, String location, String status, String equipmentType);
    
    /**
     * Find equipment by model, location, status, and criticality
     */
    List<Equipment> findByModelAndLocationAndStatusAndCriticality(String model, String location, String status, String criticality);
    
    /**
     * Find equipment by model, location, status, and category
     */
    List<Equipment> findByModelAndLocationAndStatusAndCategory(String model, String location, String status, String category);
    
    /**
     * Find equipment by model, location, status, and department
     */
    List<Equipment> findByModelAndLocationAndStatusAndDepartment(String model, String location, String status, String department);
    
    /**
     * Find equipment by model, location, status, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndCostCenter(String model, String location, String status, String costCenter);
    
    /**
     * Find equipment by model, location, equipment type, and criticality
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCriticality(String model, String location, String equipmentType, String criticality);
    
    /**
     * Find equipment by model, location, equipment type, and category
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCategory(String model, String location, String equipmentType, String category);
    
    /**
     * Find equipment by model, location, equipment type, and department
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndDepartment(String model, String location, String equipmentType, String department);
    
    /**
     * Find equipment by model, location, equipment type, and cost center
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCostCenter(String model, String location, String equipmentType, String costCenter);
    
    /**
     * Find equipment by model, location, criticality, and category
     */
    List<Equipment> findByModelAndLocationAndCriticalityAndCategory(String model, String location, String criticality, String category);
    
    /**
     * Find equipment by model, location, criticality, and department
     */
    List<Equipment> findByModelAndLocationAndCriticalityAndDepartment(String model, String location, String criticality, String department);
    
    /**
     * Find equipment by model, location, criticality, and cost center
     */
    List<Equipment> findByModelAndLocationAndCriticalityAndCostCenter(String model, String location, String criticality, String costCenter);
    
    /**
     * Find equipment by model, location, category, and department
     */
    List<Equipment> findByModelAndLocationAndCategoryAndDepartment(String model, String location, String category, String department);
    
    /**
     * Find equipment by model, location, category, and cost center
     */
    List<Equipment> findByModelAndLocationAndCategoryAndCostCenter(String model, String location, String category, String costCenter);
    
    /**
     * Find equipment by model, location, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndDepartmentAndCostCenter(String model, String location, String department, String costCenter);
    
    /**
     * Find equipment by model, status, equipment type, and criticality
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCriticality(String model, String status, String equipmentType, String criticality);
    
    /**
     * Find equipment by model, status, equipment type, and category
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCategory(String model, String status, String equipmentType, String category);
    
    /**
     * Find equipment by model, status, equipment type, and department
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndDepartment(String model, String status, String equipmentType, String department);
    
    /**
     * Find equipment by model, status, equipment type, and cost center
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCostCenter(String model, String status, String equipmentType, String costCenter);
    
    /**
     * Find equipment by model, status, criticality, and category
     */
    List<Equipment> findByModelAndStatusAndCriticalityAndCategory(String model, String status, String criticality, String category);
    
    /**
     * Find equipment by model, status, criticality, and department
     */
    List<Equipment> findByModelAndStatusAndCriticalityAndDepartment(String model, String status, String criticality, String department);
    
    /**
     * Find equipment by model, status, criticality, and cost center
     */
    List<Equipment> findByModelAndStatusAndCriticalityAndCostCenter(String model, String status, String criticality, String costCenter);
    
    /**
     * Find equipment by model, status, category, and department
     */
    List<Equipment> findByModelAndStatusAndCategoryAndDepartment(String model, String status, String category, String department);
    
    /**
     * Find equipment by model, status, category, and cost center
     */
    List<Equipment> findByModelAndStatusAndCategoryAndCostCenter(String model, String status, String category, String costCenter);
    
    /**
     * Find equipment by model, status, department, and cost center
     */
    List<Equipment> findByModelAndStatusAndDepartmentAndCostCenter(String model, String status, String department, String costCenter);
    
    /**
     * Find equipment by model, equipment type, criticality, and category
     */
    List<Equipment> findByModelAndEquipmentTypeAndCriticalityAndCategory(String model, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by model, equipment type, criticality, and department
     */
    List<Equipment> findByModelAndEquipmentTypeAndCriticalityAndDepartment(String model, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by model, equipment type, criticality, and cost center
     */
    List<Equipment> findByModelAndEquipmentTypeAndCriticalityAndCostCenter(String model, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by model, equipment type, category, and department
     */
    List<Equipment> findByModelAndEquipmentTypeAndCategoryAndDepartment(String model, String equipmentType, String category, String department);
    
    /**
     * Find equipment by model, equipment type, category, and cost center
     */
    List<Equipment> findByModelAndEquipmentTypeAndCategoryAndCostCenter(String model, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by model, equipment type, department, and cost center
     */
    List<Equipment> findByModelAndEquipmentTypeAndDepartmentAndCostCenter(String model, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by model, criticality, category, and department
     */
    List<Equipment> findByModelAndCriticalityAndCategoryAndDepartment(String model, String criticality, String category, String department);
    
    /**
     * Find equipment by model, criticality, category, and cost center
     */
    List<Equipment> findByModelAndCriticalityAndCategoryAndCostCenter(String model, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by model, criticality, department, and cost center
     */
    List<Equipment> findByModelAndCriticalityAndDepartmentAndCostCenter(String model, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by model, category, department, and cost center
     */
    List<Equipment> findByModelAndCategoryAndDepartmentAndCostCenter(String model, String category, String department, String costCenter);
    
    /**
     * Find equipment by location, status, equipment type, and criticality
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCriticality(String location, String status, String equipmentType, String criticality);
    
    /**
     * Find equipment by location, status, equipment type, and category
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCategory(String location, String status, String equipmentType, String category);
    
    /**
     * Find equipment by location, status, equipment type, and department
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndDepartment(String location, String status, String equipmentType, String department);
    
    /**
     * Find equipment by location, status, equipment type, and cost center
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCostCenter(String location, String status, String equipmentType, String costCenter);
    
    /**
     * Find equipment by location, status, criticality, and category
     */
    List<Equipment> findByLocationAndStatusAndCriticalityAndCategory(String location, String status, String criticality, String category);
    
    /**
     * Find equipment by location, status, criticality, and department
     */
    List<Equipment> findByLocationAndStatusAndCriticalityAndDepartment(String location, String status, String criticality, String department);
    
    /**
     * Find equipment by location, status, criticality, and cost center
     */
    List<Equipment> findByLocationAndStatusAndCriticalityAndCostCenter(String location, String status, String criticality, String costCenter);
    
    /**
     * Find equipment by location, status, category, and department
     */
    List<Equipment> findByLocationAndStatusAndCategoryAndDepartment(String location, String status, String category, String department);
    
    /**
     * Find equipment by location, status, category, and cost center
     */
    List<Equipment> findByLocationAndStatusAndCategoryAndCostCenter(String location, String status, String category, String costCenter);
    
    /**
     * Find equipment by location, status, department, and cost center
     */
    List<Equipment> findByLocationAndStatusAndDepartmentAndCostCenter(String location, String status, String department, String costCenter);
    
    /**
     * Find equipment by location, equipment type, criticality, and category
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCriticalityAndCategory(String location, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by location, equipment type, criticality, and department
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCriticalityAndDepartment(String location, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by location, equipment type, criticality, and cost center
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCriticalityAndCostCenter(String location, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by location, equipment type, category, and department
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCategoryAndDepartment(String location, String equipmentType, String category, String department);
    
    /**
     * Find equipment by location, equipment type, category, and cost center
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCategoryAndCostCenter(String location, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by location, equipment type, department, and cost center
     */
    List<Equipment> findByLocationAndEquipmentTypeAndDepartmentAndCostCenter(String location, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by location, criticality, category, and department
     */
    List<Equipment> findByLocationAndCriticalityAndCategoryAndDepartment(String location, String criticality, String category, String department);
    
    /**
     * Find equipment by location, criticality, category, and cost center
     */
    List<Equipment> findByLocationAndCriticalityAndCategoryAndCostCenter(String location, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by location, criticality, department, and cost center
     */
    List<Equipment> findByLocationAndCriticalityAndDepartmentAndCostCenter(String location, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by location, category, department, and cost center
     */
    List<Equipment> findByLocationAndCategoryAndDepartmentAndCostCenter(String location, String category, String department, String costCenter);
    
    /**
     * Find equipment by status, equipment type, criticality, and category
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCriticalityAndCategory(String status, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by status, equipment type, criticality, and department
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCriticalityAndDepartment(String status, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by status, equipment type, criticality, and cost center
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCriticalityAndCostCenter(String status, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by status, equipment type, category, and department
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCategoryAndDepartment(String status, String equipmentType, String category, String department);
    
    /**
     * Find equipment by status, equipment type, category, and cost center
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCategoryAndCostCenter(String status, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by status, equipment type, department, and cost center
     */
    List<Equipment> findByStatusAndEquipmentTypeAndDepartmentAndCostCenter(String status, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by status, criticality, category, and department
     */
    List<Equipment> findByStatusAndCriticalityAndCategoryAndDepartment(String status, String criticality, String category, String department);
    
    /**
     * Find equipment by status, criticality, category, and cost center
     */
    List<Equipment> findByStatusAndCriticalityAndCategoryAndCostCenter(String status, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by status, criticality, department, and cost center
     */
    List<Equipment> findByStatusAndCriticalityAndDepartmentAndCostCenter(String status, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by status, category, department, and cost center
     */
    List<Equipment> findByStatusAndCategoryAndDepartmentAndCostCenter(String status, String category, String department, String costCenter);
    
    /**
     * Find equipment by equipment type, criticality, category, and department
     */
    List<Equipment> findByEquipmentTypeAndCriticalityAndCategoryAndDepartment(String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by equipment type, criticality, category, and cost center
     */
    List<Equipment> findByEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by equipment type, criticality, department, and cost center
     */
    List<Equipment> findByEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by equipment type, category, department, and cost center
     */
    List<Equipment> findByEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by criticality, category, department, and cost center
     */
    List<Equipment> findByCriticalityAndCategoryAndDepartmentAndCostCenter(String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, status, and equipment type
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndEquipmentType(String manufacturer, String model, String location, String status, String equipmentType);
    
    /**
     * Find equipment by manufacturer, model, location, status, and criticality
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndCriticality(String manufacturer, String model, String location, String status, String criticality);
    
    /**
     * Find equipment by manufacturer, model, location, status, and category
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndCategory(String manufacturer, String model, String location, String status, String category);
    
    /**
     * Find equipment by manufacturer, model, location, status, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndDepartment(String manufacturer, String model, String location, String status, String department);
    
    /**
     * Find equipment by manufacturer, model, location, status, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndCostCenter(String manufacturer, String model, String location, String status, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, and criticality
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentTypeAndCriticality(String manufacturer, String model, String location, String equipmentType, String criticality);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, and category
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentTypeAndCategory(String manufacturer, String model, String location, String equipmentType, String category);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentTypeAndDepartment(String manufacturer, String model, String location, String equipmentType, String department);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentTypeAndCostCenter(String manufacturer, String model, String location, String equipmentType, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, criticality, and category
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCriticalityAndCategory(String manufacturer, String model, String location, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, model, location, criticality, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCriticalityAndDepartment(String manufacturer, String model, String location, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, model, location, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCriticalityAndCostCenter(String manufacturer, String model, String location, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCategoryAndDepartment(String manufacturer, String model, String location, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, location, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCategoryAndCostCenter(String manufacturer, String model, String location, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndDepartmentAndCostCenter(String manufacturer, String model, String location, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, equipment type, and criticality
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentTypeAndCriticality(String manufacturer, String model, String status, String equipmentType, String criticality);
    
    /**
     * Find equipment by manufacturer, model, status, equipment type, and category
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentTypeAndCategory(String manufacturer, String model, String status, String equipmentType, String category);
    
    /**
     * Find equipment by manufacturer, model, status, equipment type, and department
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentTypeAndDepartment(String manufacturer, String model, String status, String equipmentType, String department);
    
    /**
     * Find equipment by manufacturer, model, status, equipment type, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentTypeAndCostCenter(String manufacturer, String model, String status, String equipmentType, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, criticality, and category
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCriticalityAndCategory(String manufacturer, String model, String status, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, model, status, criticality, and department
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCriticalityAndDepartment(String manufacturer, String model, String status, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, model, status, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCriticalityAndCostCenter(String manufacturer, String model, String status, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCategoryAndDepartment(String manufacturer, String model, String status, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, status, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCategoryAndCostCenter(String manufacturer, String model, String status, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndDepartmentAndCostCenter(String manufacturer, String model, String status, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, equipment type, criticality, and category
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCriticalityAndCategory(String manufacturer, String model, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, model, equipment type, criticality, and department
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCriticalityAndDepartment(String manufacturer, String model, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, model, equipment type, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCriticalityAndCostCenter(String manufacturer, String model, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, equipment type, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCategoryAndDepartment(String manufacturer, String model, String equipmentType, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, equipment type, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCategoryAndCostCenter(String manufacturer, String model, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, equipment type, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndDepartmentAndCostCenter(String manufacturer, String model, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndCriticalityAndCategoryAndDepartment(String manufacturer, String model, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndCriticalityAndCategoryAndCostCenter(String manufacturer, String model, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String model, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndCategoryAndDepartmentAndCostCenter(String manufacturer, String model, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, equipment type, and criticality
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentTypeAndCriticality(String manufacturer, String location, String status, String equipmentType, String criticality);
    
    /**
     * Find equipment by manufacturer, location, status, equipment type, and category
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentTypeAndCategory(String manufacturer, String location, String status, String equipmentType, String category);
    
    /**
     * Find equipment by manufacturer, location, status, equipment type, and department
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentTypeAndDepartment(String manufacturer, String location, String status, String equipmentType, String department);
    
    /**
     * Find equipment by manufacturer, location, status, equipment type, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentTypeAndCostCenter(String manufacturer, String location, String status, String equipmentType, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, criticality, and category
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCriticalityAndCategory(String manufacturer, String location, String status, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, location, status, criticality, and department
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCriticalityAndDepartment(String manufacturer, String location, String status, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, location, status, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCriticalityAndCostCenter(String manufacturer, String location, String status, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, category, and department
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCategoryAndDepartment(String manufacturer, String location, String status, String category, String department);
    
    /**
     * Find equipment by manufacturer, location, status, category, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCategoryAndCostCenter(String manufacturer, String location, String status, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndDepartmentAndCostCenter(String manufacturer, String location, String status, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, equipment type, criticality, and category
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCriticalityAndCategory(String manufacturer, String location, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, location, equipment type, criticality, and department
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCriticalityAndDepartment(String manufacturer, String location, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, location, equipment type, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCriticalityAndCostCenter(String manufacturer, String location, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, equipment type, category, and department
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCategoryAndDepartment(String manufacturer, String location, String equipmentType, String category, String department);
    
    /**
     * Find equipment by manufacturer, location, equipment type, category, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCategoryAndCostCenter(String manufacturer, String location, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, equipment type, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndDepartmentAndCostCenter(String manufacturer, String location, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndLocationAndCriticalityAndCategoryAndDepartment(String manufacturer, String location, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, location, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndCriticalityAndCategoryAndCostCenter(String manufacturer, String location, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String location, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndCategoryAndDepartmentAndCostCenter(String manufacturer, String location, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, equipment type, criticality, and category
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCriticalityAndCategory(String manufacturer, String status, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, status, equipment type, criticality, and department
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCriticalityAndDepartment(String manufacturer, String status, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, status, equipment type, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCriticalityAndCostCenter(String manufacturer, String status, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, equipment type, category, and department
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCategoryAndDepartment(String manufacturer, String status, String equipmentType, String category, String department);
    
    /**
     * Find equipment by manufacturer, status, equipment type, category, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCategoryAndCostCenter(String manufacturer, String status, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, equipment type, department, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndDepartmentAndCostCenter(String manufacturer, String status, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndStatusAndCriticalityAndCategoryAndDepartment(String manufacturer, String status, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, status, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndCriticalityAndCategoryAndCostCenter(String manufacturer, String status, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String status, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndCategoryAndDepartmentAndCostCenter(String manufacturer, String status, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, equipment type, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String manufacturer, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String manufacturer, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, equipment type, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String manufacturer, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, criticality, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndCriticalityAndCategoryAndDepartmentAndCostCenter(String manufacturer, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by model, location, status, equipment type, and criticality
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentTypeAndCriticality(String model, String location, String status, String equipmentType, String criticality);
    
    /**
     * Find equipment by model, location, status, equipment type, and category
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentTypeAndCategory(String model, String location, String status, String equipmentType, String category);
    
    /**
     * Find equipment by model, location, status, equipment type, and department
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentTypeAndDepartment(String model, String location, String status, String equipmentType, String department);
    
    /**
     * Find equipment by model, location, status, equipment type, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentTypeAndCostCenter(String model, String location, String status, String equipmentType, String costCenter);
    
    /**
     * Find equipment by model, location, status, criticality, and category
     */
    List<Equipment> findByModelAndLocationAndStatusAndCriticalityAndCategory(String model, String location, String status, String criticality, String category);
    
    /**
     * Find equipment by model, location, status, criticality, and department
     */
    List<Equipment> findByModelAndLocationAndStatusAndCriticalityAndDepartment(String model, String location, String status, String criticality, String department);
    
    /**
     * Find equipment by model, location, status, criticality, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndCriticalityAndCostCenter(String model, String location, String status, String criticality, String costCenter);
    
    /**
     * Find equipment by model, location, status, category, and department
     */
    List<Equipment> findByModelAndLocationAndStatusAndCategoryAndDepartment(String model, String location, String status, String category, String department);
    
    /**
     * Find equipment by model, location, status, category, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndCategoryAndCostCenter(String model, String location, String status, String category, String costCenter);
    
    /**
     * Find equipment by model, location, status, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndDepartmentAndCostCenter(String model, String location, String status, String department, String costCenter);
    
    /**
     * Find equipment by model, location, equipment type, criticality, and category
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCriticalityAndCategory(String model, String location, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by model, location, equipment type, criticality, and department
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCriticalityAndDepartment(String model, String location, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by model, location, equipment type, criticality, and cost center
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCriticalityAndCostCenter(String model, String location, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by model, location, equipment type, category, and department
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCategoryAndDepartment(String model, String location, String equipmentType, String category, String department);
    
    /**
     * Find equipment by model, location, equipment type, category, and cost center
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCategoryAndCostCenter(String model, String location, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by model, location, equipment type, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndDepartmentAndCostCenter(String model, String location, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by model, location, criticality, category, and department
     */
    List<Equipment> findByModelAndLocationAndCriticalityAndCategoryAndDepartment(String model, String location, String criticality, String category, String department);
    
    /**
     * Find equipment by model, location, criticality, category, and cost center
     */
    List<Equipment> findByModelAndLocationAndCriticalityAndCategoryAndCostCenter(String model, String location, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by model, location, criticality, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndCriticalityAndDepartmentAndCostCenter(String model, String location, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by model, location, category, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndCategoryAndDepartmentAndCostCenter(String model, String location, String category, String department, String costCenter);
    
    /**
     * Find equipment by model, status, equipment type, criticality, and category
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCriticalityAndCategory(String model, String status, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by model, status, equipment type, criticality, and department
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCriticalityAndDepartment(String model, String status, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by model, status, equipment type, criticality, and cost center
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCriticalityAndCostCenter(String model, String status, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by model, status, equipment type, category, and department
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCategoryAndDepartment(String model, String status, String equipmentType, String category, String department);
    
    /**
     * Find equipment by model, status, equipment type, category, and cost center
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCategoryAndCostCenter(String model, String status, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by model, status, equipment type, department, and cost center
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndDepartmentAndCostCenter(String model, String status, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by model, status, criticality, category, and department
     */
    List<Equipment> findByModelAndStatusAndCriticalityAndCategoryAndDepartment(String model, String status, String criticality, String category, String department);
    
    /**
     * Find equipment by model, status, criticality, category, and cost center
     */
    List<Equipment> findByModelAndStatusAndCriticalityAndCategoryAndCostCenter(String model, String status, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by model, status, criticality, department, and cost center
     */
    List<Equipment> findByModelAndStatusAndCriticalityAndDepartmentAndCostCenter(String model, String status, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by model, status, category, department, and cost center
     */
    List<Equipment> findByModelAndStatusAndCategoryAndDepartmentAndCostCenter(String model, String status, String category, String department, String costCenter);
    
    /**
     * Find equipment by model, equipment type, criticality, category, and department
     */
    List<Equipment> findByModelAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String model, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by model, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByModelAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String model, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by model, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByModelAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String model, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by model, equipment type, category, department, and cost center
     */
    List<Equipment> findByModelAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String model, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by model, criticality, category, department, and cost center
     */
    List<Equipment> findByModelAndCriticalityAndCategoryAndDepartmentAndCostCenter(String model, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by location, status, equipment type, criticality, and category
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCriticalityAndCategory(String location, String status, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by location, status, equipment type, criticality, and department
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCriticalityAndDepartment(String location, String status, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by location, status, equipment type, criticality, and cost center
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCriticalityAndCostCenter(String location, String status, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by location, status, equipment type, category, and department
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCategoryAndDepartment(String location, String status, String equipmentType, String category, String department);
    
    /**
     * Find equipment by location, status, equipment type, category, and cost center
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCategoryAndCostCenter(String location, String status, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by location, status, equipment type, department, and cost center
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndDepartmentAndCostCenter(String location, String status, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by location, status, criticality, category, and department
     */
    List<Equipment> findByLocationAndStatusAndCriticalityAndCategoryAndDepartment(String location, String status, String criticality, String category, String department);
    
    /**
     * Find equipment by location, status, criticality, category, and cost center
     */
    List<Equipment> findByLocationAndStatusAndCriticalityAndCategoryAndCostCenter(String location, String status, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by location, status, criticality, department, and cost center
     */
    List<Equipment> findByLocationAndStatusAndCriticalityAndDepartmentAndCostCenter(String location, String status, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by location, status, category, department, and cost center
     */
    List<Equipment> findByLocationAndStatusAndCategoryAndDepartmentAndCostCenter(String location, String status, String category, String department, String costCenter);
    
    /**
     * Find equipment by location, equipment type, criticality, category, and department
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String location, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by location, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String location, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by location, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String location, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by location, equipment type, category, department, and cost center
     */
    List<Equipment> findByLocationAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String location, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by location, criticality, category, department, and cost center
     */
    List<Equipment> findByLocationAndCriticalityAndCategoryAndDepartmentAndCostCenter(String location, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by status, equipment type, criticality, category, and department
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String status, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by status, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String status, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by status, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String status, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by status, equipment type, category, department, and cost center
     */
    List<Equipment> findByStatusAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String status, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by status, criticality, category, department, and cost center
     */
    List<Equipment> findByStatusAndCriticalityAndCategoryAndDepartmentAndCostCenter(String status, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by equipment type, criticality, category, department, and cost center
     */
    List<Equipment> findByEquipmentTypeAndCriticalityAndCategoryAndDepartmentAndCostCenter(String equipmentType, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, status, equipment type, and criticality
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndEquipmentTypeAndCriticality(String manufacturer, String model, String location, String status, String equipmentType, String criticality);
    
    /**
     * Find equipment by manufacturer, model, location, status, equipment type, and category
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndEquipmentTypeAndCategory(String manufacturer, String model, String location, String status, String equipmentType, String category);
    
    /**
     * Find equipment by manufacturer, model, location, status, equipment type, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndEquipmentTypeAndDepartment(String manufacturer, String model, String location, String status, String equipmentType, String department);
    
    /**
     * Find equipment by manufacturer, model, location, status, equipment type, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndEquipmentTypeAndCostCenter(String manufacturer, String model, String location, String status, String equipmentType, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, status, criticality, and category
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndCriticalityAndCategory(String manufacturer, String model, String location, String status, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, model, location, status, criticality, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndCriticalityAndDepartment(String manufacturer, String model, String location, String status, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, model, location, status, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndCriticalityAndCostCenter(String manufacturer, String model, String location, String status, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, status, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndCategoryAndDepartment(String manufacturer, String model, String location, String status, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, location, status, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndCategoryAndCostCenter(String manufacturer, String model, String location, String status, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, status, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndDepartmentAndCostCenter(String manufacturer, String model, String location, String status, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, criticality, and category
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentTypeAndCriticalityAndCategory(String manufacturer, String model, String location, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, criticality, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentTypeAndCriticalityAndDepartment(String manufacturer, String model, String location, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentTypeAndCriticalityAndCostCenter(String manufacturer, String model, String location, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentTypeAndCategoryAndDepartment(String manufacturer, String model, String location, String equipmentType, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentTypeAndCategoryAndCostCenter(String manufacturer, String model, String location, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndEquipmentTypeAndDepartmentAndCostCenter(String manufacturer, String model, String location, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCriticalityAndCategoryAndDepartment(String manufacturer, String model, String location, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, location, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCriticalityAndCategoryAndCostCenter(String manufacturer, String model, String location, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String model, String location, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndCategoryAndDepartmentAndCostCenter(String manufacturer, String model, String location, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, equipment type, criticality, and category
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentTypeAndCriticalityAndCategory(String manufacturer, String model, String status, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, model, status, equipment type, criticality, and department
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentTypeAndCriticalityAndDepartment(String manufacturer, String model, String status, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, model, status, equipment type, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentTypeAndCriticalityAndCostCenter(String manufacturer, String model, String status, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, equipment type, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentTypeAndCategoryAndDepartment(String manufacturer, String model, String status, String equipmentType, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, status, equipment type, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentTypeAndCategoryAndCostCenter(String manufacturer, String model, String status, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, equipment type, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndEquipmentTypeAndDepartmentAndCostCenter(String manufacturer, String model, String status, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCriticalityAndCategoryAndDepartment(String manufacturer, String model, String status, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, status, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCriticalityAndCategoryAndCostCenter(String manufacturer, String model, String status, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String model, String status, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, status, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndStatusAndCategoryAndDepartmentAndCostCenter(String manufacturer, String model, String status, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, equipment type, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String manufacturer, String model, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String manufacturer, String model, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String model, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, equipment type, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String manufacturer, String model, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, criticality, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndCriticalityAndCategoryAndDepartmentAndCostCenter(String manufacturer, String model, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, equipment type, criticality, and category
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentTypeAndCriticalityAndCategory(String manufacturer, String location, String status, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by manufacturer, location, status, equipment type, criticality, and department
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentTypeAndCriticalityAndDepartment(String manufacturer, String location, String status, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by manufacturer, location, status, equipment type, criticality, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentTypeAndCriticalityAndCostCenter(String manufacturer, String location, String status, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, equipment type, category, and department
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentTypeAndCategoryAndDepartment(String manufacturer, String location, String status, String equipmentType, String category, String department);
    
    /**
     * Find equipment by manufacturer, location, status, equipment type, category, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentTypeAndCategoryAndCostCenter(String manufacturer, String location, String status, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, equipment type, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndEquipmentTypeAndDepartmentAndCostCenter(String manufacturer, String location, String status, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCriticalityAndCategoryAndDepartment(String manufacturer, String location, String status, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, location, status, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCriticalityAndCategoryAndCostCenter(String manufacturer, String location, String status, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String location, String status, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, status, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndStatusAndCategoryAndDepartmentAndCostCenter(String manufacturer, String location, String status, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, equipment type, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String manufacturer, String location, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, location, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String manufacturer, String location, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String location, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, equipment type, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String manufacturer, String location, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, location, criticality, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndLocationAndCriticalityAndCategoryAndDepartmentAndCostCenter(String manufacturer, String location, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, equipment type, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String manufacturer, String status, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, status, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String manufacturer, String status, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String status, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, equipment type, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String manufacturer, String status, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, status, criticality, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndStatusAndCriticalityAndCategoryAndDepartmentAndCostCenter(String manufacturer, String status, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by model, location, status, equipment type, criticality, and category
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentTypeAndCriticalityAndCategory(String model, String location, String status, String equipmentType, String criticality, String category);
    
    /**
     * Find equipment by model, location, status, equipment type, criticality, and department
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentTypeAndCriticalityAndDepartment(String model, String location, String status, String equipmentType, String criticality, String department);
    
    /**
     * Find equipment by model, location, status, equipment type, criticality, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentTypeAndCriticalityAndCostCenter(String model, String location, String status, String equipmentType, String criticality, String costCenter);
    
    /**
     * Find equipment by model, location, status, equipment type, category, and department
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentTypeAndCategoryAndDepartment(String model, String location, String status, String equipmentType, String category, String department);
    
    /**
     * Find equipment by model, location, status, equipment type, category, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentTypeAndCategoryAndCostCenter(String model, String location, String status, String equipmentType, String category, String costCenter);
    
    /**
     * Find equipment by model, location, status, equipment type, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndEquipmentTypeAndDepartmentAndCostCenter(String model, String location, String status, String equipmentType, String department, String costCenter);
    
    /**
     * Find equipment by model, location, status, criticality, category, and department
     */
    List<Equipment> findByModelAndLocationAndStatusAndCriticalityAndCategoryAndDepartment(String model, String location, String status, String criticality, String category, String department);
    
    /**
     * Find equipment by model, location, status, criticality, category, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndCriticalityAndCategoryAndCostCenter(String model, String location, String status, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by model, location, status, criticality, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndCriticalityAndDepartmentAndCostCenter(String model, String location, String status, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by model, location, status, category, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndStatusAndCategoryAndDepartmentAndCostCenter(String model, String location, String status, String category, String department, String costCenter);
    
    /**
     * Find equipment by model, location, equipment type, criticality, category, and department
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String model, String location, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by model, location, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String model, String location, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by model, location, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String model, String location, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by model, location, equipment type, category, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String model, String location, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by model, location, criticality, category, department, and cost center
     */
    List<Equipment> findByModelAndLocationAndCriticalityAndCategoryAndDepartmentAndCostCenter(String model, String location, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by model, status, equipment type, criticality, category, and department
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String model, String status, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by model, status, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String model, String status, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by model, status, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String model, String status, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by model, status, equipment type, category, department, and cost center
     */
    List<Equipment> findByModelAndStatusAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String model, String status, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by model, status, criticality, category, department, and cost center
     */
    List<Equipment> findByModelAndStatusAndCriticalityAndCategoryAndDepartmentAndCostCenter(String model, String status, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by model, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by location, status, equipment type, criticality, category, and department
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String location, String status, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by location, status, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String location, String status, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by location, status, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String location, String status, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by location, status, equipment type, category, department, and cost center
     */
    List<Equipment> findByLocationAndStatusAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String location, String status, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by location, status, criticality, category, department, and cost center
     */
    List<Equipment> findByLocationAndStatusAndCriticalityAndCategoryAndDepartmentAndCostCenter(String location, String status, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by location, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by manufacturer, model, location, status, equipment type, criticality, category, and department
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndEquipmentTypeAndCriticalityAndCategoryAndDepartment(String manufacturer, String model, String location, String status, String equipmentType, String criticality, String category, String department);
    
    /**
     * Find equipment by manufacturer, model, location, status, equipment type, criticality, category, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndEquipmentTypeAndCriticalityAndCategoryAndCostCenter(String manufacturer, String model, String location, String status, String equipmentType, String criticality, String category, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, status, equipment type, criticality, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndEquipmentTypeAndCriticalityAndDepartmentAndCostCenter(String manufacturer, String model, String location, String status, String equipmentType, String criticality, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, status, equipment type, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndEquipmentTypeAndCategoryAndDepartmentAndCostCenter(String manufacturer, String model, String location, String status, String equipmentType, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, status, criticality, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndCriticalityAndCategoryAndDepartmentAndCostCenter(String manufacturer, String model, String location, String status, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by manufacturer, model, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by manufacturer, location, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by manufacturer, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by manufacturer, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by model, location, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by model, location, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by model, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by model, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by location, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by location, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by manufacturer, model, location, status, equipment type, criticality, category, department, and cost center
     */
    List<Equipment> findByManufacturerAndModelAndLocationAndStatusAndEquipmentTypeAndCriticalityAndCategoryAndDepartmentAndCostCenter(String manufacturer, String model, String location, String status, String equipmentType, String criticality, String category, String department, String costCenter);
    
    /**
     * Find equipment by manufacturer, model, location, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by manufacturer, model, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by manufacturer, location, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by manufacturer, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by manufacturer, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by model, location, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by model, location, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by model, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by model, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by location, status, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by location, equipment type, criticality, category, department, and cost center
     */
    /**
     * Find equipment by status, equipment type, criticality, category, department, and cost center
     */
}