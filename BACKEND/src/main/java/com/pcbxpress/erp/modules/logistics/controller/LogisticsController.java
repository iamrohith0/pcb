package com.pcbxpress.erp.modules.logistics.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Main Logistics Controller
 * Routes requests to specific logistics module controllers
 */
@RestController
@RequestMapping("/api/logistics")
public class LogisticsController {
    
    // This controller serves as a base path for all logistics operations
    // Individual module controllers handle specific endpoints:
    // - /api/logistics/dispatch/* -> DispatchController
    // - /api/logistics/shipments/* -> ShipmentController
    // - /api/logistics/tracking/* -> TrackingController
    
    // No additional endpoints needed here as each module has its own controller
}
