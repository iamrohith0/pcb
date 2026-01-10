package com.pcbxpress.erp.modules.maintenance.spares.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pcbxpress.erp.modules.maintenance.spares.model.Spares;

/**
 * Repository interface for Spares entity
 */
@Repository
public interface SparesRepository extends JpaRepository<Spares, UUID> {
    
    /**
     * Find spares by spare code
     */
    Spares findBySpareCode(String spareCode);
    
    /**
     * Find spares by spare name
     */
    List<Spares> findBySpareName(String spareName);
    
    /**
     * Find spares by category
     */
    List<Spares> findByCategory(String category);
    
    /**
     * Find spares by sub category
     */
    List<Spares> findBySubCategory(String subCategory);
    
    /**
     * Find spares by part number
     */
    List<Spares> findByPartNumber(String partNumber);
    
    /**
     * Find spares by manufacturer
     */
    List<Spares> findByManufacturer(String manufacturer);
    
    /**
     * Find spares by model
     */
    List<Spares> findByModel(String model);
    
    /**
     * Find spares by supplier
     */
    List<Spares> findBySupplier(String supplier);
    
    /**
     * Find spares by unit of measure
     */
    List<Spares> findByUnitOfMeasure(String unitOfMeasure);
    
    /**
     * Find spares by location
     */
    List<Spares> findByLocation(String location);
    
    /**
     * Find spares by bin location
     */
    List<Spares> findByBinLocation(String binLocation);
    
    /**
     * Find spares by status
     */
    List<Spares> findByStatus(String status);
    
    /**
     * Find spares by criticality
     */
    List<Spares> findByCriticality(String criticality);
    
    /**
     * Find spares by compatibility
     */
    List<Spares> findByCompatibility(String compatibility);
    
    /**
     * Find spares by current stock
     */
    List<Spares> findByCurrentStock(Integer currentStock);
    
    /**
     * Find spares by minimum stock
     */
    List<Spares> findByMinimumStock(Integer minimumStock);
    
    /**
     * Find spares by maximum stock
     */
    List<Spares> findByMaximumStock(Integer maximumStock);
    
    /**
     * Find spares by unit price
     */
    List<Spares> findByUnitPrice(Double unitPrice);
    
    /**
     * Find spares by category and sub category
     */
    List<Spares> findByCategoryAndSubCategory(String category, String subCategory);
    
    /**
     * Find spares by category and location
     */
    List<Spares> findByCategoryAndLocation(String category, String location);
    
    /**
     * Find spares by category and status
     */
    List<Spares> findByCategoryAndStatus(String category, String status);
    
    /**
     * Find spares by category and criticality
     */
    List<Spares> findByCategoryAndCriticality(String category, String criticality);
    
    /**
     * Find spares by sub category and location
     */
    List<Spares> findBySubCategoryAndLocation(String subCategory, String location);
    
    /**
     * Find spares by sub category and status
     */
    List<Spares> findBySubCategoryAndStatus(String subCategory, String status);
    
    /**
     * Find spares by sub category and criticality
     */
    List<Spares> findBySubCategoryAndCriticality(String subCategory, String criticality);
    
    /**
     * Find spares by manufacturer and model
     */
    List<Spares> findByManufacturerAndModel(String manufacturer, String model);
    
    /**
     * Find spares by manufacturer and supplier
     */
    List<Spares> findByManufacturerAndSupplier(String manufacturer, String supplier);
    
    /**
     * Find spares by manufacturer and location
     */
    List<Spares> findByManufacturerAndLocation(String manufacturer, String location);
    
    /**
     * Find spares by manufacturer and status
     */
    List<Spares> findByManufacturerAndStatus(String manufacturer, String status);
    
    /**
     * Find spares by model and supplier
     */
    List<Spares> findByModelAndSupplier(String model, String supplier);
    
    /**
     * Find spares by model and location
     */
    List<Spares> findByModelAndLocation(String model, String location);
    
    /**
     * Find spares by model and status
     */
    List<Spares> findByModelAndStatus(String model, String status);
    
    /**
     * Find spares by supplier and location
     */
    List<Spares> findBySupplierAndLocation(String supplier, String location);
    
    /**
     * Find spares by supplier and status
     */
    List<Spares> findBySupplierAndStatus(String supplier, String status);
    
    /**
     * Find spares by location and status
     */
    List<Spares> findByLocationAndStatus(String location, String status);
    
    /**
     * Find spares by location and criticality
     */
    List<Spares> findByLocationAndCriticality(String location, String criticality);
    
    /**
     * Find spares by status and criticality
     */
    List<Spares> findByStatusAndCriticality(String status, String criticality);
    
    /**
     * Find spares by current stock and minimum stock
     */
    List<Spares> findByCurrentStockAndMinimumStock(Integer currentStock, Integer minimumStock);
    
    /**
     * Find spares by current stock and maximum stock
     */
    List<Spares> findByCurrentStockAndMaximumStock(Integer currentStock, Integer maximumStock);
    
    /**
     * Find spares by minimum stock and maximum stock
     */
    List<Spares> findByMinimumStockAndMaximumStock(Integer minimumStock, Integer maximumStock);
    
    /**
     * Find spares by unit price and location
     */
    List<Spares> findByUnitPriceAndLocation(Double unitPrice, String location);
    
    /**
     * Find spares by unit price and status
     */
    List<Spares> findByUnitPriceAndStatus(Double unitPrice, String status);
    
    /**
     * Find spares by unit price and criticality
     */
    List<Spares> findByUnitPriceAndCriticality(Double unitPrice, String criticality);
    
    /**
     * Find spares by category, sub category, and location
     */
    List<Spares> findByCategoryAndSubCategoryAndLocation(String category, String subCategory, String location);
    
    /**
     * Find spares by category, sub category, and status
     */
    List<Spares> findByCategoryAndSubCategoryAndStatus(String category, String subCategory, String status);
    
    /**
     * Find spares by category, sub category, and criticality
     */
    List<Spares> findByCategoryAndSubCategoryAndCriticality(String category, String subCategory, String criticality);
    
    /**
     * Find spares by manufacturer, model, and supplier
     */
    List<Spares> findByManufacturerAndModelAndSupplier(String manufacturer, String model, String supplier);
    
    /**
     * Find spares by manufacturer, model, and location
     */
    List<Spares> findByManufacturerAndModelAndLocation(String manufacturer, String model, String location);
    
    /**
     * Find spares by manufacturer, model, and status
     */
    List<Spares> findByManufacturerAndModelAndStatus(String manufacturer, String model, String status);
    
    /**
     * Find spares by manufacturer, supplier, and location
     */
    List<Spares> findByManufacturerAndSupplierAndLocation(String manufacturer, String supplier, String location);
    
    /**
     * Find spares by manufacturer, supplier, and status
     */
    List<Spares> findByManufacturerAndSupplierAndStatus(String manufacturer, String supplier, String status);
    
    /**
     * Find spares by manufacturer, location, and status
     */
    List<Spares> findByManufacturerAndLocationAndStatus(String manufacturer, String location, String status);
    
    /**
     * Find spares by model, supplier, and location
     */
    List<Spares> findByModelAndSupplierAndLocation(String model, String supplier, String location);
    
    /**
     * Find spares by model, supplier, and status
     */
    List<Spares> findByModelAndSupplierAndStatus(String model, String supplier, String status);
    
    /**
     * Find spares by model, location, and status
     */
    List<Spares> findByModelAndLocationAndStatus(String model, String location, String status);
    
    /**
     * Find spares by supplier, location, and status
     */
    List<Spares> findBySupplierAndLocationAndStatus(String supplier, String location, String status);
    
    /**
     * Find spares by location, status, and criticality
     */
    List<Spares> findByLocationAndStatusAndCriticality(String location, String status, String criticality);
    
    /**
     * Find spares by current stock less than minimum stock (low stock alert)
     */
    List<Spares> findByCurrentStockLessThan(Integer minimumStock);
    
    /**
     * Find spares by current stock greater than maximum stock (overstock alert)
     */
    List<Spares> findByCurrentStockGreaterThan(Integer maximumStock);
    
    /**
     * Find spares by current stock between minimum and maximum stock
     */
    List<Spares> findByCurrentStockBetween(Integer minimumStock, Integer maximumStock);
    
    /**
     * Find spares by unit price between minimum and maximum price
     */
    List<Spares> findByUnitPriceBetween(Double minPrice, Double maxPrice);
}