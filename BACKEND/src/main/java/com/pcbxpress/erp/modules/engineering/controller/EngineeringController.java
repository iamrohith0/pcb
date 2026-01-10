package com.pcbxpress.erp.modules.engineering.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/engineering")
public class EngineeringController {
    
    @GetMapping
    public String getEngineeringOverview() {
        return "PCB Express ERP - Engineering Module\n" +
               "Available endpoints:\n" +
               "- /api/engineering/cam-jobs - CAM Job Management\n" +
               "- /api/engineering/cam-outputs - CAM Output Management\n" +
               "- /api/engineering/dfm/checklists - DFM Checklist Management\n" +
               "- /api/engineering/stackup/templates - Stackup Template Management\n" +
               "- /api/engineering/stackup/material-rules - Material Rule Management";
    }
    
    @GetMapping("/health")
    public String healthCheck() {
        return "Engineering Module is healthy and running";
    }
}