package com.pcbxpress.erp.modules.inventory.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Main Inventory Controller
 * Provides API endpoints for inventory management including items, stock, lots, serials, and adjustments
 *
 * Sub-module endpoints:
 * - /api/inventory/items - Item management
 * - /api/inventory/stock - Stock management
 * - /api/inventory/lots - Lot tracking
 * - /api/inventory/serials - Serial number tracking
 * - /api/inventory/adjustments - Stock adjustments
 * - /api/inventory/boms - Bill of Materials
 * - /api/inventory/reports - Inventory reports
 */
@RestController
@RequestMapping({
    "/inventory",
    "/api/inventory",
    "/stock",
    "/api/stock",
    "/serials",
    "/api/serials"
})
public class InventoryController {
    
    // This controller serves as the main entry point for the Inventory module
    // Individual sub-modules have their own controllers with specific endpoints
    
}