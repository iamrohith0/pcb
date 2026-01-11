package com.pcbxpress.erp.modules.procurement.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Procurement Module Main Controller
 * Routes requests to specific procurement sub-modules
 */
@RestController
@RequestMapping("/procurement")
public class ProcurementController {
    
    // This controller serves as the main entry point for procurement module
    // Individual sub-modules (suppliers, purchase-orders, grn, pricing) 
    // have their own controllers with specific request mappings
    
    // Example routes handled by this module:
    // /procurement/suppliers/*     - Supplier management
    // /procurement/purchase-orders/* - Purchase order management  
    // /procurement/grn/*           - Goods Receipt Note management
    // /procurement/pricing/*       - Supplier pricing management
}
