package com.pcbxpress.erp.modules.inventory.reports.controller;

import com.pcbxpress.erp.modules.inventory.reports.service.InventoryReportsService;
import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for Inventory Reports
 */
@RestController
@RequestMapping("/api/inventory/reports")
public class InventoryReportsController {
    
    private final InventoryReportsService inventoryReportsService;
    
    public InventoryReportsController(InventoryReportsService inventoryReportsService) {
        this.inventoryReportsService = inventoryReportsService;
    }
    
    /**
     * Get inventory summary report
     */
    @GetMapping("/summary")
    public Map<String, Object> getInventorySummary() {
        return inventoryReportsService.getInventorySummary();
    }
    
    /**
     * Get stock aging report
     */
    @GetMapping("/stock-aging")
    public Map<String, Object> getStockAgingReport(@RequestParam(defaultValue = "30") int days) {
        return inventoryReportsService.getStockAgingReport(days);
    }
    
    /**
     * Get consumption report
     */
    @GetMapping("/consumption")
    public Map<String, Object> getConsumptionReport(
            @RequestParam String fromDate,
            @RequestParam String toDate) {
        OffsetDateTime from = OffsetDateTime.parse(fromDate);
        OffsetDateTime to = OffsetDateTime.parse(toDate);
        return inventoryReportsService.getConsumptionReport(from, to);
    }
    
    /**
     * Get slow moving items report
     */
    @GetMapping("/slow-moving")
    public Map<String, Object> getSlowMovingItemsReport(@RequestParam(defaultValue = "90") int days) {
        return inventoryReportsService.getSlowMovingItemsReport(days);
    }
    
    /**
     * Get inventory valuation report
     */
    @GetMapping("/valuation")
    public Map<String, Object> getInventoryValuationReport() {
        return inventoryReportsService.getInventoryValuationReport();
    }
    
    /**
     * Get stock turnover report
     */
    @GetMapping("/turnover")
    public Map<String, Object> getStockTurnoverReport() {
        return inventoryReportsService.getStockTurnoverReport();
    }
    
    /**
     * Get inventory accuracy report
     */
    @GetMapping("/accuracy")
    public Map<String, Object> getInventoryAccuracyReport() {
        return inventoryReportsService.getInventoryAccuracyReport();
    }
    
    /**
     * Get lot traceability report
     */
    @GetMapping("/lot-traceability")
    public Map<String, Object> getLotTraceabilityReport(@RequestParam String lotId) {
        return inventoryReportsService.getLotTraceabilityReport(lotId);
    }
    
    /**
     * Get serial traceability report
     */
    @GetMapping("/serial-traceability")
    public Map<String, Object> getSerialTraceabilityReport(@RequestParam String serialId) {
        return inventoryReportsService.getSerialTraceabilityReport(serialId);
    }
    
    /**
     * Get inventory audit report
     */
    @GetMapping("/audit")
    public Map<String, Object> getInventoryAuditReport(
            @RequestParam String fromDate,
            @RequestParam String toDate) {
        OffsetDateTime from = OffsetDateTime.parse(fromDate);
        OffsetDateTime to = OffsetDateTime.parse(toDate);
        return inventoryReportsService.getInventoryAuditReport(from, to);
    }
}