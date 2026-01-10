package com.pcbxpress.erp.modules.maintenance.spares.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pcbxpress.erp.modules.maintenance.spares.dto.SparesDto;
import com.pcbxpress.erp.modules.maintenance.spares.dto.SparesPayload;
import com.pcbxpress.erp.modules.maintenance.spares.service.SparesService;

/**
 * REST Controller for Spares management
 */
@RestController
@RequestMapping("/api/maintenance/spares")
@CrossOrigin(origins = "*")
public class SparesController {
    
    @Autowired
    private SparesService sparesService;
    
    /**
     * Get all spares with pagination
     */
    @GetMapping
    public ResponseEntity<List<SparesDto>> getAllSpares(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<SparesDto> sparesList = sparesService.getAllSpares(page, size);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get spares by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SparesDto> getSparesById(@PathVariable UUID id) {
        SparesDto spares = sparesService.getSparesById(id);
        return ResponseEntity.ok(spares);
    }
    
    /**
     * Create new spares record
     */
    @PostMapping
    public ResponseEntity<SparesDto> createSpares(@RequestBody SparesPayload payload) {
        SparesDto spares = sparesService.createSpares(payload);
        return ResponseEntity.ok(spares);
    }
    
    /**
     * Update spares record
     */
    @PutMapping("/{id}")
    public ResponseEntity<SparesDto> updateSpares(@PathVariable UUID id, @RequestBody SparesPayload payload) {
        SparesDto spares = sparesService.updateSpares(id, payload);
        return ResponseEntity.ok(spares);
    }
    
    /**
     * Delete spares record
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpares(@PathVariable UUID id) {
        sparesService.deleteSpares(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get equipment spares
     */
    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<SparesDto>> getEquipmentSpares(
            @PathVariable UUID equipmentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<SparesDto> sparesList = sparesService.getEquipmentSpares(equipmentId, page, size);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get stock levels
     */
    @GetMapping("/stock-levels")
    public ResponseEntity<List<SparesDto>> getStockLevels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        List<SparesDto> stockLevels = sparesService.getStockLevels(page, size);
        return ResponseEntity.ok(stockLevels);
    }
    
    /**
     * Update stock
     */
    @PatchMapping("/{id}/stock")
    public ResponseEntity<SparesDto> updateStock(@PathVariable UUID id, @RequestBody Integer stockChange) {
        SparesDto spares = sparesService.updateStock(id, stockChange);
        return ResponseEntity.ok(spares);
    }
    
    /**
     * Get usage report
     */
    @GetMapping("/usage-report")
    public ResponseEntity<List<SparesDto>> getUsageReport() {
        List<SparesDto> report = sparesService.getUsageReport();
        return ResponseEntity.ok(report);
    }
    
    /**
     * Get spares by spare code
     */
    @GetMapping("/code/{spareCode}")
    public ResponseEntity<SparesDto> getSparesByCode(@PathVariable String spareCode) {
        SparesDto spares = sparesService.getSparesByCode(spareCode);
        return ResponseEntity.ok(spares);
    }
    
    /**
     * Get spares by spare name
     */
    @GetMapping("/name/{spareName}")
    public ResponseEntity<List<SparesDto>> getSparesByName(@PathVariable String spareName) {
        List<SparesDto> sparesList = sparesService.getSparesByName(spareName);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get spares by category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<List<SparesDto>> getSparesByCategory(@PathVariable String category) {
        List<SparesDto> sparesList = sparesService.getSparesByCategory(category);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get spares by sub category
     */
    @GetMapping("/sub-category/{subCategory}")
    public ResponseEntity<List<SparesDto>> getSparesBySubCategory(@PathVariable String subCategory) {
        List<SparesDto> sparesList = sparesService.getSparesBySubCategory(subCategory);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get spares by part number
     */
    @GetMapping("/part/{partNumber}")
    public ResponseEntity<List<SparesDto>> getSparesByPartNumber(@PathVariable String partNumber) {
        List<SparesDto> sparesList = sparesService.getSparesByPartNumber(partNumber);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get spares by manufacturer
     */
    @GetMapping("/manufacturer/{manufacturer}")
    public ResponseEntity<List<SparesDto>> getSparesByManufacturer(@PathVariable String manufacturer) {
        List<SparesDto> sparesList = sparesService.getSparesByManufacturer(manufacturer);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get spares by model
     */
    @GetMapping("/model/{model}")
    public ResponseEntity<List<SparesDto>> getSparesByModel(@PathVariable String model) {
        List<SparesDto> sparesList = sparesService.getSparesByModel(model);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get spares by supplier
     */
    @GetMapping("/supplier/{supplier}")
    public ResponseEntity<List<SparesDto>> getSparesBySupplier(@PathVariable String supplier) {
        List<SparesDto> sparesList = sparesService.getSparesBySupplier(supplier);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get spares by location
     */
    @GetMapping("/location/{location}")
    public ResponseEntity<List<SparesDto>> getSparesByLocation(@PathVariable String location) {
        List<SparesDto> sparesList = sparesService.getSparesByLocation(location);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get spares by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<SparesDto>> getSparesByStatus(@PathVariable String status) {
        List<SparesDto> sparesList = sparesService.getSparesByStatus(status);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get spares by criticality
     */
    @GetMapping("/criticality/{criticality}")
    public ResponseEntity<List<SparesDto>> getSparesByCriticality(@PathVariable String criticality) {
        List<SparesDto> sparesList = sparesService.getSparesByCriticality(criticality);
        return ResponseEntity.ok(sparesList);
    }
    
    /**
     * Get low stock alert
     */
    @GetMapping("/low-stock")
    public ResponseEntity<List<SparesDto>> getLowStockAlert() {
        List<SparesDto> lowStockList = sparesService.getLowStockAlert();
        return ResponseEntity.ok(lowStockList);
    }
    
    /**
     * Get overstock alert
     */
    @GetMapping("/overstock")
    public ResponseEntity<List<SparesDto>> getOverstockAlert() {
        List<SparesDto> overstockList = sparesService.getOverstockAlert();
        return ResponseEntity.ok(overstockList);
    }
    
    /**
     * Get spares by price range
     */
    @GetMapping("/price-range")
    public ResponseEntity<List<SparesDto>> getSparesByPriceRange(
            @RequestParam Double minPrice,
            @RequestParam Double maxPrice) {
        List<SparesDto> sparesList = sparesService.getSparesByPriceRange(minPrice, maxPrice);
        return ResponseEntity.ok(sparesList);
    }
}