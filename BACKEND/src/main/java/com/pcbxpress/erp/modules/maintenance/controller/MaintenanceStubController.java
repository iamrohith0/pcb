package com.pcbxpress.erp.modules.maintenance.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/maintenance",
    "/maintenance/**",
    "/api/maintenance",
    "/api/maintenance/**"
})
public class MaintenanceStubController extends AbstractStubController {
}
