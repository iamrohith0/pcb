package com.pcbxpress.erp.modules.inventory.stock.controller;

import com.pcbxpress.erp.modules.inventory.stock.dto.StockDto;
import com.pcbxpress.erp.modules.inventory.stock.service.StockService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Stock Management
 */
@RestController
@RequestMapping("/api/inventory/stock")
public class StockController {
    
    private final StockService stockService;
    
    public StockController(StockService stockService) {
        this.stockService = stockService;
    }
    
    /**
     * Get stock summary for dashboard
     */
    @GetMapping("/summary")
    public Map<String, Object> getSummary() {
        return stockService.getSummary();
    }
    
    /**
     * Get stock alerts
     */
    @GetMapping("/alerts")
    public List<StockDto> getAlerts() {
        return stockService.getAlerts();
    }
    
    /**
     * Get recent stock movements
     */
    @GetMapping("/movements")
    public List<Object[]> getMovements(@RequestParam(defaultValue = "30") int days) {
        return stockService.getMovements(days);
    }
    
    /**
     * Get stock by item
     */
    @GetMapping("/items/{itemId}")
    public List<StockDto> getByItem(@PathVariable String itemId) {
        return stockService.getByItem(itemId);
    }
    
    /**
     * Get stock by warehouse
     */
    @GetMapping("/warehouses/{warehouseId}")
    public List<StockDto> getByWarehouse(@PathVariable String warehouseId) {
        return stockService.getByWarehouse(warehouseId);
    }
    
    /**
     * Get stock adjustments
     */
    @GetMapping("/adjustments")
    public List<Map<String, Object>> getAdjustments(
            @RequestParam(required = false) String itemId,
            @RequestParam(defaultValue = "50") int limit) {
        return stockService.getAdjustments(itemId, limit);
    }
    
    /**
     * Get stock lots
     */
    @GetMapping("/lots")
    public List<StockDto> getLots(@RequestParam String itemId) {
        return stockService.getLots(itemId);
    }
    
    /**
     * Get stock serials
     */
    @GetMapping("/serials")
    public List<StockDto> getSerials(@RequestParam String itemId) {
        return stockService.getSerials(itemId);
    }
    
    /**
     * Get stock by location
     */
    @GetMapping("/locations/{locationId}")
    public List<StockDto> getByLocation(@PathVariable String locationId) {
        return stockService.getByLocation(locationId);
    }
    
    /**
     * Get stock by status
     */
    @GetMapping("/status/{status}")
    public List<StockDto> getByStatus(@PathVariable String status) {
        return stockService.getByStatus(
            com.pcbxpress.erp.modules.inventory.stock.model.Stock.StockStatus.valueOf(status.toUpperCase())
        );
    }
    
    /**
     * Get expiring stock
     */
    @GetMapping("/expiring")
    public List<StockDto> getExpiringStock(@RequestParam(defaultValue = "30") int days) {
        return stockService.getExpiringStock(days);
    }
    
    /**
     * Get inactive stock
     */
    @GetMapping("/inactive")
    public List<StockDto> getInactiveStock(@RequestParam(defaultValue = "3") int months) {
        return stockService.getInactiveStock(months);
    }
    
    /**
     * Get stock statistics
     */
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return stockService.getStats();
    }
}