package com.pcbxpress.erp.modules.quality.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Main Quality Controller that organizes all quality sub-modules
 * 
 * Endpoints:
 * - /quality/aoi/defects - AOI Defects master
 * - /quality/aoi/queue - AOI Queue management
 * - /quality/aoi/results - AOI Results and rework
 * - /quality/capa - CAPA (Corrective and Preventive Actions)
 * - /quality/certificates/coc - Certificates of Conformance
 * - /quality/certificates/etest - E-Test certificates
 * - /quality/certificates/compliance - Compliance documents
 * - /quality/ncr - Non-Conformance Reports
 * - /quality/inspections - Quality inspections
 */
@RestController
@RequestMapping({
    "/quality",
    "/quality/**",
    "/api/quality",
    "/api/quality/**"
})
public class QualityController {
    
    // This controller serves as the main entry point for the quality module
    // Individual sub-modules have their own controllers with specific endpoints
    
}