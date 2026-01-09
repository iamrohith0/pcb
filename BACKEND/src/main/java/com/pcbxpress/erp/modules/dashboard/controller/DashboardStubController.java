package com.pcbxpress.erp.modules.dashboard.controller;

import com.pcbxpress.erp.modules.stub.AbstractStubController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({
    "/dashboard",
    "/dashboard/**",
    "/api/dashboard",
    "/api/dashboard/**"
})
public class DashboardStubController extends AbstractStubController {
}
