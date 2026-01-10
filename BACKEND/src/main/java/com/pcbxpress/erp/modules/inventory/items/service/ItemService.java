package com.pcbxpress.erp.modules.inventory.items.service;

import com.pcbxpress.erp.modules.inventory.items.dto.ItemDto;
import com.pcbxpress.erp.modules.inventory.items.dto.ItemPayload;
import com.pcbxpress.erp.modules.inventory.items.model.Item;
import com.pcbxpress.erp.modules.inventory.items.repository.ItemRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for managing Inventory Items
 */
@Service
@Transactional
public class ItemService {
    
    private final ItemRepository itemRepository;
    
    public ItemService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }
    
    /**
     * List items with optional filters
     */
    public List<ItemDto> list(String query, String category, Item.ItemType itemType, Boolean isActive) {
        return itemRepository.findByCriteria(category, itemType, isActive, query).stream()
            .sorted(Comparator.comparing(Item::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get a single item by ID
     */
    public ItemDto get(String id) {
        Item item = itemRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Item not found: " + id));
        return toDto(item);
    }
    
    /**
     * Create a new item
     */
    public ItemDto create(ItemPayload payload) {
        // Validate unique constraints
        validateUniqueConstraints(payload, null);
        
        Item item = new Item();
        item.setId(UUID.randomUUID());
        applyPayload(item, payload);
        
        // Auto-generate item code if not provided
        if (item.getItemCode() == null || item.getItemCode().isBlank()) {
            item.setItemCode(generateItemCode());
        }
        
        // Set default values
        if (item.isActive() == false) {
            item.setActive(true);
        }
        
        Item saved = itemRepository.save(item);
        return toDto(saved);
    }
    
    /**
     * Update an existing item
     */
    public ItemDto update(String id, ItemPayload payload) {
        Item existing = itemRepository.findById(parseId(id))
            .orElseThrow(() -> new NoSuchElementException("Item not found: " + id));
        
        validateUniqueConstraints(payload, existing.getId().toString());
        applyPayload(existing, payload);
        
        Item saved = itemRepository.save(existing);
        return toDto(saved);
    }
    
    /**
     * Delete an item
     */
    public void delete(String id) {
        itemRepository.deleteById(parseId(id));
    }
    
    /**
     * Delete multiple items
     */
    public void deleteBulk(List<String> ids) {
        List<UUID> uuidList = ids.stream().map(ItemService::parseId).collect(Collectors.toList());
        itemRepository.deleteAllById(uuidList);
    }
    
    /**
     * Search items by query
     */
    public List<ItemDto> search(String query) {
        return itemRepository.findByCriteria(null, null, null, query).stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get items needing reorder
     */
    public List<ItemDto> findItemsNeedingReorder() {
        return itemRepository.findItemsNeedingReorder().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get items with low stock
     */
    public List<ItemDto> findItemsWithLowStock() {
        return itemRepository.findItemsWithLowStock().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get items with high stock
     */
    public List<ItemDto> findItemsWithHighStock() {
        return itemRepository.findItemsWithHighStock().stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }
    
    /**
     * Get item statistics
     */
    public Map<String, Object> getStats() {
        List<Item> all = itemRepository.findAll();
        long total = all.size();
        long active = all.stream().filter(Item::isActive).count();
        long inactive = all.stream().filter(item -> !item.isActive()).count();
        long serialized = all.stream().filter(Item::isSerialized).count();
        long lotTracked = all.stream().filter(Item::isLotTracked).count();
        
        // Count by category
        Map<String, Long> byCategory = all.stream()
            .filter(item -> item.getCategory() != null)
            .collect(Collectors.groupingBy(Item::getCategory, Collectors.counting()));
        
        // Count by item type
        Map<Item.ItemType, Long> byType = all.stream()
            .collect(Collectors.groupingBy(Item::getItemType, Collectors.counting()));
        
        return Map.of(
            "total", total,
            "active", active,
            "inactive", inactive,
            "serialized", serialized,
            "lotTracked", lotTracked,
            "byCategory", byCategory,
            "byType", byType
        );
    }
    
    /**
     * Export items to CSV format
     */
    public String exportCsv(List<ItemDto> data) {
        String header = "Item Code,Name,Description,Category,Type,Unit of Measure,Reorder Level,Reorder Quantity,Active,Serialized,Lot Tracked";
        String rows = data.stream()
            .map(item -> String.join(",",
                safe(item.itemCode()),
                safe(item.name()),
                safe(item.description()),
                safe(item.category()),
                safe(item.itemType() != null ? item.itemType().toString() : ""),
                safe(item.unitOfMeasure()),
                safe(item.reorderLevel() != null ? item.reorderLevel().toString() : ""),
                safe(item.reorderQuantity() != null ? item.reorderQuantity().toString() : ""),
                item.isActive() ? "Yes" : "No",
                item.isSerialized() ? "Yes" : "No",
                item.isLotTracked() ? "Yes" : "No"
            ))
            .collect(Collectors.joining("\n"));
        return header + "\n" + rows;
    }
    
    // Private helper methods
    
    private static UUID parseId(String id) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException ex) {
            throw new NoSuchElementException("Item not found: " + id);
        }
    }
    
    private static String generateItemCode() {
        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        return "ITEM-" + token;
    }
    
    private void validateUniqueConstraints(ItemPayload payload, String existingId) {
        UUID existingUUID = existingId != null ? UUID.fromString(existingId) : null;
        
        // Check for duplicate item code
        if (payload.itemCode() != null && !payload.itemCode().isBlank()) {
            boolean exists = itemRepository.existsByItemCodeIgnoreCaseAndIdNot(payload.itemCode(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Item code already exists: " + payload.itemCode());
            }
        }
        
        // Check for duplicate SKU
        if (payload.sku() != null && !payload.sku().isBlank()) {
            boolean exists = itemRepository.existsBySkuIgnoreCaseAndIdNot(payload.sku(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("SKU already exists: " + payload.sku());
            }
        }
        
        // Check for duplicate barcode
        if (payload.barcode() != null && !payload.barcode().isBlank()) {
            boolean exists = itemRepository.existsByBarcodeAndIdNot(payload.barcode(), existingUUID);
            if (exists) {
                throw new IllegalArgumentException("Barcode already exists: " + payload.barcode());
            }
        }
    }
    
    private void applyPayload(Item target, ItemPayload payload) {
        target.setItemCode(payload.itemCode());
        target.setName(payload.name());
        target.setDescription(payload.description());
        target.setSku(payload.sku());
        target.setCategory(payload.category());
        target.setSubcategory(payload.subcategory());
        target.setItemType(payload.itemType());
        target.setUnitOfMeasure(payload.unitOfMeasure());
        target.setReorderLevel(payload.reorderLevel());
        target.setReorderQuantity(payload.reorderQuantity());
        target.setMinStockLevel(payload.minStockLevel());
        target.setMaxStockLevel(payload.maxStockLevel());
        target.setCostPrice(payload.costPrice());
        target.setSellingPrice(payload.sellingPrice());
        target.setWeight(payload.weight());
        target.setLength(payload.length());
        target.setWidth(payload.width());
        target.setHeight(payload.height());
        target.setVolume(payload.volume());
        target.setActive(payload.isActive());
        target.setSerialized(payload.isSerialized());
        target.setLotTracked(payload.isLotTracked());
        target.setShelfLifeDays(payload.shelfLifeDays());
        target.setHazardousMaterial(payload.hazardousMaterial());
        target.setStorageConditions(payload.storageConditions());
        target.setSupplierPartNumber(payload.supplierPartNumber());
        target.setManufacturer(payload.manufacturer());
        target.setManufacturerPartNumber(payload.manufacturerPartNumber());
        target.setBarcode(payload.barcode());
        target.setNotes(payload.notes());
    }
    
    private ItemDto toDto(Item item) {
        return new ItemDto(
            item.getId().toString(),
            item.getItemCode(),
            item.getName(),
            item.getDescription(),
            item.getSku(),
            item.getCategory(),
            item.getSubcategory(),
            item.getItemType(),
            item.getUnitOfMeasure(),
            item.getReorderLevel(),
            item.getReorderQuantity(),
            item.getMinStockLevel(),
            item.getMaxStockLevel(),
            item.getCostPrice(),
            item.getSellingPrice(),
            item.getWeight(),
            item.getLength(),
            item.getWidth(),
            item.getHeight(),
            item.getVolume(),
            item.isActive(),
            item.isSerialized(),
            item.isLotTracked(),
            item.getShelfLifeDays(),
            item.isHazardousMaterial(),
            item.getStorageConditions(),
            item.getSupplierPartNumber(),
            item.getManufacturer(),
            item.getManufacturerPartNumber(),
            item.getBarcode(),
            item.getNotes(),
            safeOffset(item.getCreatedAt()),
            safeOffset(item.getUpdatedAt())
        );
    }
    
    private static String safe(String value) {
        return value == null ? "" : value.replace(",", " ");
    }
    
    private static OffsetDateTime safeOffset(OffsetDateTime value) {
        return value != null ? value : OffsetDateTime.now();
    }
}