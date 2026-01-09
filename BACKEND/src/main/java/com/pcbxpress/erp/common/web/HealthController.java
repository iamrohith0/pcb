package com.pcbxpress.erp.common.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    @GetMapping({"/health", "/api/health"})
    public ApiResponse health() {
        return ApiResponse.of("Backend is up", "/health");
    }
}
