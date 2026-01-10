package com.pcbxpress.erp.modules.inventory.items.repository;

import com.pcbxpress.erp.modules.inventory.items.model.Item;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Inventory Items
 */
@Repository
public interface ItemRepository extends JpaRepository<Item, UUID> {
    
    /**
     * Find item by item code (case insensitive)
     */
    Item findByItemCodeIgnoreCase(String itemCode);
    
    /**
     * Find item by SKU (case insensitive)
     */
    Item findBySkuIgnoreCase(String sku);
    
    /**
     * Find item by barcode
     */
    Item findByBarcode(String barcode);
    
    /**
     * Find item by supplier part number
     */
    Item findBySupplierPartNumber(String supplierPartNumber);
    
    /**
     * Find item by manufacturer part number
     */
    Item findByManufacturerPartNumber(String manufacturerPartNumber);
    
    /**
     * Check if item code exists (excluding current item)
     */
    boolean existsByItemCodeIgnoreCaseAndIdNot(String itemCode, UUID id);
    
    /**
     * Check if SKU exists (excluding current item)
     */
    boolean existsBySkuIgnoreCaseAndIdNot(String sku, UUID id);
    
    /**
     * Check if barcode exists (excluding current item)
     */
    boolean existsByBarcodeAndIdNot(String barcode, UUID id);
    
    /**
     * Find items by category
     */
    List<Item> findByCategoryIgnoreCase(String category);
    
    /**
     * Find items by subcategory
     */
    List<Item> findBySubcategoryIgnoreCase(String subcategory);
    
    /**
     * Find items by item type
     */
    List<Item> findByItemType(Item.ItemType itemType);
    
    /**
     * Find active items
     */
    List<Item> findByIsActiveTrue();
    
    /**
     * Find items by name containing text (case insensitive)
     */
    List<Item> findByNameContainingIgnoreCase(String name);
    
    /**
     * Find items by description containing text (case insensitive)
     */
    List<Item> findByDescriptionContainingIgnoreCase(String description);
    
    /**
     * Find items by category and active status
     */
    List<Item> findByCategoryIgnoreCaseAndIsActiveTrue(String category);
    
    /**
     * Find items by item type and active status
     */
    List<Item> findByItemTypeAndIsActiveTrue(Item.ItemType itemType);
    
    /**
     * Find items that need reordering (current stock below reorder level)
     */
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.reorderLevel IS NOT NULL " +
           "AND i.id IN (SELECT s.itemId FROM Stock s WHERE s.quantity < i.reorderLevel)")
    List<Item> findItemsNeedingReorder();
    
    /**
     * Find items with low stock (below min stock level)
     */
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.minStockLevel IS NOT NULL " +
           "AND i.id IN (SELECT s.itemId FROM Stock s WHERE s.quantity < i.minStockLevel)")
    List<Item> findItemsWithLowStock();
    
    /**
     * Find items with high stock (above max stock level)
     */
    @Query("SELECT i FROM Item i WHERE i.isActive = true AND i.maxStockLevel IS NOT NULL " +
           "AND i.id IN (SELECT s.itemId FROM Stock s WHERE s.quantity > i.maxStockLevel)")
    List<Item> findItemsWithHighStock();
    
    /**
     * Find items by multiple criteria
     */
    @Query("SELECT i FROM Item i WHERE " +
           "(:category IS NULL OR LOWER(i.category) = LOWER(:category)) " +
           "AND (:itemType IS NULL OR i.itemType = :itemType) " +
           "AND (:isActive IS NULL OR i.isActive = :isActive) " +
           "AND (:searchText IS NULL OR " +
           "LOWER(i.name) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(i.description) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(i.itemCode) LIKE LOWER(CONCAT('%', :searchText, '%')) OR " +
           "LOWER(i.sku) LIKE LOWER(CONCAT('%', :searchText, '%')))")
    List<Item> findByCriteria(@Param("category") String category,
                             @Param("itemType") Item.ItemType itemType,
                             @Param("isActive") Boolean isActive,
                             @Param("searchText") String searchText);
}