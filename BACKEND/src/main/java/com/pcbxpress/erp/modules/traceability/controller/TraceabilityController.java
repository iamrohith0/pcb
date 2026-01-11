package com.pcbxpress.erp.modules.traceability.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Main Traceability Controller
 * Routes to sub-modules: batch, genealogy, recall
 */
@RestController
@RequestMapping({
    "/api/traceability",
    "/api/traceability/**"
})
public class TraceabilityController {
    
    // This controller serves as the main entry point for traceability APIs
    // Individual sub-modules have their own controllers:
    // - /api/traceability/batch/* (BatchController)
    // - /api/traceability/genealogy/* (LotGenealogyController)
    // - /api/traceability/recall/* (RecallController)
    
    // The sub-module controllers handle all the specific endpoints
    // This main controller can be used for general traceability operations
    // or to provide a unified API gateway if needed in the future
}
